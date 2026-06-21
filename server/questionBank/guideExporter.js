const express = require('express');
const router = express.Router();
const { findById } = require("../../database/questionBank/questionBankDB");

router.get('/:id', async (req, res) => {
  try {
    const questionBankId = req.params.id;
    const questionBank = await findById(questionBankId);

    if (!questionBank) {
      return res.status(404).json({ error: "Not found" });
    }

    if (req.query.format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Disposition', `attachment; filename="interview-guide-${questionBankId}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      doc.pipe(res);
      
      // Document Title Header
      const brandName = req.query.brand || 'SmartInterviewer AI';
      doc.fillColor('#1e1b4b').fontSize(24).font('Helvetica-Bold').text(brandName, { align: 'center' });
      doc.fillColor('#4f46e5').fontSize(13).font('Helvetica-Bold').text('RECRUITER INTERVIEW BLUEPRINT GUIDE', { align: 'center', paragraphGap: 20 });
      
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(1.5);
      
      // Metadata Details
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(`Target Role: `, { continued: true });
      doc.font('Helvetica').text(questionBank.job_role || 'N/A');
      
      doc.font('Helvetica-Bold').text(`Target Industry: `, { continued: true });
      doc.font('Helvetica').text(questionBank.industry || 'N/A');
      
      doc.font('Helvetica-Bold').text(`Seniority Level: `, { continued: true });
      doc.font('Helvetica').text(questionBank.seniority_level || 'N/A');
      doc.moveDown(1.5);
      
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(1.5);
      
      // Iterating through questions list
      const questions = questionBank.questions_array || [];
      questions.forEach((q, idx) => {
        doc.fillColor('#4f46e5').fontSize(11).font('Helvetica-Bold').text(`Question ${idx + 1} (${q.type === 'technical' ? 'Technical' : 'Behavioral'} - Expectation: ${q.methodology_expectation})`);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(q.text, { paragraphGap: 10 });
        
        if (q.competency) {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('Target Competency: ', { continued: true });
          doc.font('Helvetica').text(q.competency);
        }
        
        if (q.hr_keywords && q.hr_keywords.length > 0) {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('Key Concepts to Listen For: ', { continued: true });
          doc.font('Helvetica').text(q.hr_keywords.join(', '));
        }
        doc.moveDown(0.5);
        
        if (q.red_flags && q.red_flags.length > 0) {
          doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text('🚩 Red Flags / Answers to Penalize:');
          q.red_flags.forEach(flag => {
            doc.fillColor('#b91c1c').fontSize(9).font('Helvetica').text(`  • ${flag}`);
          });
          doc.moveDown(0.5);
        }
        
        if (q.follow_ups && q.follow_ups.length > 0) {
          doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('🔍 Deep-Probe Follow-up Questions:');
          q.follow_ups.forEach(f => {
            doc.fillColor('#334155').fontSize(9).font('Helvetica').text(`  • ${f}`);
          });
          doc.moveDown(0.5);
        }
        
        doc.moveDown(1.5);
        
        if (idx < questions.length - 1) {
          doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
          doc.moveDown(1.5);
        }
      });
      
      doc.end();
      return;
    }

    res.setHeader('Content-Disposition', 'attachment; filename="interview-guide.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.json(questionBank);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;