import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useCascade() {
  const [trades, setTrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    api.get('/trades').then(r => setTrades(r.data.data || [])).catch(() => {});
    api.get('/academic-years').then(r => setAcademicYears(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTrade) { setClasses([]); return; }
    api.get(`/classes?trade_id=${selectedTrade}`).then(r => setClasses(r.data.data || [])).catch(() => {});
    setSelectedClass('');
    setSelectedSubject('');
  }, [selectedTrade]);

  useEffect(() => {
    if (!selectedYear) { setTerms([]); return; }
    api.get(`/terms?academic_year_id=${selectedYear}`).then(r => setTerms(r.data.data || [])).catch(() => {});
    setSelectedTerm('');
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return; }
    const params = new URLSearchParams({ trade_id: selectedTrade, class_id: selectedClass });
    api.get(`/subjects?${params}`).then(r => setSubjects(r.data.data || [])).catch(() => {});
    setSelectedSubject('');
  }, [selectedClass, selectedTrade]);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    api.get(`/students?class_id=${selectedClass}&trade_id=${selectedTrade}`)
      .then(r => setStudents(r.data.data || [])).catch(() => {});
  }, [selectedSubject, selectedClass, selectedTrade]);

  const resetCascade = useCallback(() => {
    setSelectedTrade('');
    setSelectedYear('');
    setSelectedTerm('');
    setSelectedClass('');
    setSelectedSubject('');
  }, []);

  return {
    trades, academicYears, terms, classes, subjects, students,
    selectedTrade, setSelectedTrade,
    selectedYear, setSelectedYear,
    selectedTerm, setSelectedTerm,
    selectedClass, setSelectedClass,
    selectedSubject, setSelectedSubject,
    resetCascade
  };
}
