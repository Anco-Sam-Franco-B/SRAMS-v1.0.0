import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import ReportCardPDF from './ReportCardPDF';

export default function ReportCardDownload({ reportData, student, marks, term, school }) {
  return (
    <PDFDownloadLink
      document={<ReportCardPDF reportData={reportData} student={student} marks={marks} term={term} school={school} />}
      fileName={`report-card-${student?.admission_no || 'student'}.pdf`}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition text-sm font-medium"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {loading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
