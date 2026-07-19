import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 2, borderBottomColor: '#1e40af' },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: '#1e40af' },
  reportTitle: { fontSize: 14, marginTop: 5, color: '#374151', letterSpacing: 2 },
  studentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 4 },
  infoItem: { flexDirection: 'column' },
  infoLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
  infoValue: { fontSize: 11, fontWeight: 'bold', color: '#1f2937' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#d1d5db', marginBottom: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeader: { backgroundColor: '#1e40af', color: 'white', fontWeight: 'bold', paddingVertical: 8 },
  tableCell: { padding: 6, fontSize: 9, flex: 1 },
  tableCellHeader: { padding: 6, fontSize: 9, flex: 1, color: 'white', fontWeight: 'bold' },
  summary: { marginTop: 15, padding: 15, backgroundColor: '#eff6ff', borderRadius: 4, borderLeftWidth: 4, borderLeftColor: '#1e40af' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel: { fontSize: 10, color: '#374151' },
  summaryValue: { fontSize: 10, fontWeight: 'bold', color: '#1e40af' },
  comment: { marginTop: 15, padding: 12, backgroundColor: '#fefce8', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#ca8a04' },
  commentLabel: { fontSize: 9, color: '#854d0e', fontWeight: 'bold', marginBottom: 4 },
  commentText: { fontSize: 10, color: '#422006' },
  signatures: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' },
  signature: { width: '40%', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 8, textAlign: 'center' },
  signatureLabel: { fontSize: 9, color: '#374151' },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 8, color: '#9ca3af' }
});

export default function ReportCardPDF({ reportData, student, marks, term, school }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{school?.name || 'SRAMS'}</Text>
          <Text style={styles.reportTitle}>ACADEMIC REPORT CARD</Text>
        </View>
        
        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{student?.first_name} {student?.last_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Admission No</Text>
            <Text style={styles.infoValue}>{student?.admission_no}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{student?.class_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Trade</Text>
            <Text style={styles.infoValue}>{student?.trade_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Term</Text>
            <Text style={styles.infoValue}>{term?.name}</Text>
          </View>
        </View>
        
        {/* Marks Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Subject</Text>
            <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>CA</Text>
            <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>Exam</Text>
            <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>Total</Text>
            <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>Grade</Text>
          </View>
          {marks?.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{m.subject_name}</Text>
              <Text style={[styles.tableCell, { textAlign: 'center' }]}>{m.ca_marks ?? '-'}</Text>
              <Text style={[styles.tableCell, { textAlign: 'center' }]}>{m.exam_marks ?? '-'}</Text>
              <Text style={[styles.tableCell, { textAlign: 'center' }]}>{m.total ?? m.marks}</Text>
              <Text style={[styles.tableCell, { textAlign: 'center' }]}>{m.grade || '-'}</Text>
            </View>
          ))}
        </View>
        
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Marks:</Text>
            <Text style={styles.summaryValue}>{reportData?.total_marks}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average:</Text>
            <Text style={styles.summaryValue}>{reportData?.average}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Position:</Text>
            <Text style={styles.summaryValue}>{reportData?.position}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Overall Grade:</Text>
            <Text style={styles.summaryValue}>{reportData?.grade}</Text>
          </View>
        </View>
        
        {/* Teacher Comment */}
        <View style={styles.comment}>
          <Text style={styles.commentLabel}>Teacher's Comment:</Text>
          <Text style={styles.commentText}>{reportData?.teacher_comment || 'No comment'}</Text>
        </View>
        
        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signature}>
            <Text style={styles.signatureLabel}>Class Teacher</Text>
          </View>
          <View style={styles.signature}>
            <Text style={styles.signatureLabel}>Principal</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Generated by SRAMS - Student Records & Academic Management System</Text>
        </View>
      </Page>
    </Document>
  );
}
