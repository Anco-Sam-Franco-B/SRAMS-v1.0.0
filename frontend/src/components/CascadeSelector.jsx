import { useEffect } from 'react';
import { useCascade } from '../hooks/useCascade';

export default function CascadeSelector({ onChange, steps = ['trade', 'year', 'term', 'class', 'subject'], autoSelectCurrent = true }) {
  const cascade = useCascade();

  useEffect(() => {
    if (autoSelectCurrent) {
      // Auto-select current academic year and term
      const currentYear = cascade.academicYears.find(y => y.is_current);
      if (currentYear && !cascade.selectedYear) cascade.setSelectedYear(currentYear.id);
      const currentTerm = cascade.terms.find(t => t.is_current);
      if (currentTerm && !cascade.selectedTerm) cascade.setSelectedTerm(currentTerm.id);
    }
  }, [cascade.academicYears, cascade.terms]);

  useEffect(() => {
    onChange?.(cascade);
  }, [cascade.selectedTrade, cascade.selectedYear, cascade.selectedTerm, cascade.selectedClass, cascade.selectedSubject]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {steps.includes('trade') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trade / Department</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cascade.selectedTrade} onChange={e => cascade.setSelectedTrade(e.target.value)}>
            <option value="">Select Trade</option>
            {cascade.trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {steps.includes('year') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cascade.selectedYear} onChange={e => cascade.setSelectedYear(e.target.value)}>
            <option value="">Select Year</option>
            {cascade.academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</option>)}
          </select>
        </div>
      )}
      {steps.includes('term') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cascade.selectedTerm} onChange={e => cascade.setSelectedTerm(e.target.value)}>
            <option value="">Select Term</option>
            {cascade.terms.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' (Current)' : ''}</option>)}
          </select>
        </div>
      )}
      {steps.includes('class') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cascade.selectedClass} onChange={e => cascade.setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {cascade.classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.level}</option>)}
          </select>
        </div>
      )}
      {steps.includes('subject') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cascade.selectedSubject} onChange={e => cascade.setSelectedSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {cascade.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
