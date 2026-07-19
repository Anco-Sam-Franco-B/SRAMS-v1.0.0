-- SRAMS Stored Procedures / Functions

-- =============================================
-- fn_calculate_student_average
-- Returns average, total_marks, and subject_count for a student in a term
-- =============================================
CREATE OR REPLACE FUNCTION fn_calculate_student_average(
  p_student_id UUID,
  p_term_id UUID
)
RETURNS TABLE (
  average NUMERIC(5,2),
  total_marks NUMERIC(10,2),
  subject_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(m.marks), 2), 0) AS average,
    COALESCE(SUM(m.marks), 0) AS total_marks,
    COUNT(m.id) AS subject_count
  FROM marks m
  JOIN assessments a ON m.assessment_id = a.id
  WHERE m.student_id = p_student_id
    AND a.term_id = p_term_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- fn_attendance_summary
-- Returns attendance statistics for a student in a date range
-- =============================================
CREATE OR REPLACE FUNCTION fn_attendance_summary(
  p_student_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_days BIGINT,
  attendance_percentage NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'PRESENT') AS present_count,
    COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent_count,
    COUNT(*) FILTER (WHERE status = 'LATE') AS late_count,
    COUNT(*) FILTER (WHERE status = 'EXCUSED') AS excused_count,
    COUNT(*) AS total_days,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status IN ('PRESENT', 'LATE', 'EXCUSED'))::NUMERIC / COUNT(*)) * 100, 2)
    END AS attendance_percentage
  FROM attendance
  WHERE student_id = p_student_id
    AND attendance_date BETWEEN p_date_from AND p_date_to;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- fn_class_rankings
-- Returns student rankings within a class for a term
-- =============================================
CREATE OR REPLACE FUNCTION fn_class_rankings(
  p_class_id UUID,
  p_term_id UUID
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  admission_no TEXT,
  average NUMERIC(5,2),
  position BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH student_avgs AS (
    SELECT
      s.id AS sid,
      (s.first_name || ' ' || s.last_name) AS sname,
      s.admission_no AS adm_no,
      COALESCE(ROUND(AVG(m.marks), 2), 0) AS avg_marks
    FROM students s
    LEFT JOIN marks m ON m.student_id = s.id
    LEFT JOIN assessments a ON m.assessment_id = a.id AND a.term_id = p_term_id
    WHERE s.class_id = p_class_id
    GROUP BY s.id, s.first_name, s.last_name, s.admission_no
  )
  SELECT
    sa.sid AS student_id,
    sa.sname AS student_name,
    sa.adm_no AS admission_no,
    sa.avg_marks AS average,
    RANK() OVER (ORDER BY sa.avg_marks DESC) AS position
  FROM student_avgs sa;
END;
$$ LANGUAGE plpgsql;
