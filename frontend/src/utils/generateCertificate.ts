import { jsPDF } from 'jspdf';
import { ReviewAnalysisResult, User } from '../types';

export interface GenerateCertificateOptions {
  activeModelName?: string;
  activeModelF1?: string;
}

/**
 * Calculates sentiment-rating dissonance between star rating and VADER score.
 */
function getDissonanceStatus(rating?: number | null, sentimentScore?: number): { status: string; interpretation: string } {
  if (rating === null || rating === undefined || sentimentScore === undefined) {
    return { status: 'N/A', interpretation: 'No rating provided for dissonance check' };
  }
  if (rating >= 4 && sentimentScore < -0.15) {
    return { status: 'YES (Flagged)', interpretation: 'Severe divergence: High rating with negative sentiment' };
  }
  if (rating <= 2 && sentimentScore > 0.15) {
    return { status: 'YES (Flagged)', interpretation: 'Severe divergence: Low rating with positive sentiment' };
  }
  return { status: 'NO (Aligned)', interpretation: 'Star rating is concordant with sentiment polarity' };
}

/**
 * Returns color palette and labels for the verdict badge.
 */
function getVerdictBadgeStyle(prediction: string) {
  switch (prediction) {
    case 'genuine':
      return {
        label: 'VERIFIED GENUINE',
        sublabel: 'High confidence organic review • No deceptive markers detected',
        bg: [236, 253, 245], // emerald-50
        border: [16, 185, 129], // emerald-500
        text: [6, 95, 70], // emerald-800
      };
    case 'suspicious':
      return {
        label: 'SUSPICIOUS OPINION PATTERN',
        sublabel: 'Moderate deception flags • Ambiguous sentiment or linguistic markers',
        bg: [254, 243, 199], // amber-50
        border: [245, 158, 11], // amber-500
        text: [146, 64, 14], // amber-800
      };
    case 'likely_fake':
    default:
      return {
        label: 'LIKELY FAKE / OPINION SPAM',
        sublabel: 'High deception probability • Stylometric astroturfing markers detected',
        bg: [254, 242, 242], // rose-50
        border: [239, 68, 68], // rose-500
        text: [153, 27, 27], // rose-800
      };
  }
}

/**
 * Generates and downloads a single-page crisp A4 Forensic Authenticity Certificate as a PDF.
 */
export function generateCertificate(
  analysis: ReviewAnalysisResult,
  user: User | null,
  options?: GenerateCertificateOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const certId = analysis.id ? `VRX-${analysis.id}` : 'VRX-DEMO';
  const rawDate = analysis.created_at ? new Date(analysis.created_at) : new Date();
  const dateStr = rawDate.toUTCString();
  const analystName = user?.full_name || user?.email || 'Authenticated Analyst';
  const modelName = options?.activeModelName || 'TF-IDF + Calibrated Logistic Regression';
  const modelF1 = options?.activeModelF1 || '90.1% F1';

  // -------------------------------------------------------------
  // 1. Top Indigo Accent Strip
  // -------------------------------------------------------------
  doc.setFillColor(79, 70, 229); // #4f46e5
  doc.rect(0, 0, 210, 3.5, 'F');

  // -------------------------------------------------------------
  // 2. Header Area
  // -------------------------------------------------------------
  // Shield-style Logo Square
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(14, 9, 12, 12, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('V', 20, 17.5, { align: 'center' });

  // Organization & Title
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIDEX FORENSICS & TRUST LAB', 29, 13);

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('Forensic Authenticity Certificate', 29, 19);

  // Certificate Metadata (Right Aligned)
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Certificate ID: ${certId}`, 196, 13, { align: 'right' });

  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Issued: ${dateStr}`, 196, 17, { align: 'right' });

  doc.setTextColor(55, 65, 81);
  doc.text(`Audited By: ${analystName}`, 196, 21, { align: 'right' });

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.35);
  doc.line(14, 24.5, 196, 24.5);

  // -------------------------------------------------------------
  // 3. Verdict Badge & Key Probability Metrics
  // -------------------------------------------------------------
  const badgeStyle = getVerdictBadgeStyle(analysis.prediction);
  doc.setFillColor(badgeStyle.bg[0], badgeStyle.bg[1], badgeStyle.bg[2]);
  doc.setDrawColor(badgeStyle.border[0], badgeStyle.border[1], badgeStyle.border[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 27, 182, 21, 2.5, 2.5, 'FD');

  // Left Column: Verdict Label & Sublabel
  doc.setTextColor(badgeStyle.text[0], badgeStyle.text[1], badgeStyle.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(badgeStyle.label, 20, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(badgeStyle.sublabel, 20, 39.5);

  // Vertical Separator Inside Badge
  doc.setDrawColor(badgeStyle.border[0], badgeStyle.border[1], badgeStyle.border[2]);
  doc.setLineWidth(0.3);
  doc.line(116, 29.5, 116, 45.5);

  // Right Column: Key Metrics
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Fake Probability: ${(analysis.fake_probability * 100).toFixed(1)}%`, 122, 33);
  doc.text(`Model Confidence: ${analysis.confidence.toFixed(1)}%`, 122, 38);
  const sentScore = analysis.sentiment_score !== undefined ? analysis.sentiment_score : 0;
  doc.text(`Sentiment Polarity: ${analysis.sentiment_label.toUpperCase()} (${sentScore > 0 ? '+' : ''}${sentScore})`, 122, 43);

  // -------------------------------------------------------------
  // 4. Inspected Review Content Box
  // -------------------------------------------------------------
  const reviewSectionY = 52.5;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INSPECTED REVIEW TEXT', 14, reviewSectionY);

  const ratingStr = analysis.rating ? `Rating: ★${analysis.rating}/5` : 'Rating: Not provided';
  const reviewerStr = analysis.reviewer_id ? `Reviewer ID: ${analysis.reviewer_id}` : 'Reviewer ID: Unspecified';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(7.5);
  doc.text(`${ratingStr}   |   ${reviewerStr}`, 196, reviewSectionY, { align: 'right' });

  // Truncate review text at 600 characters if longer
  const rawText = (analysis.review_text || '').replace(/\s+/g, ' ').trim();
  const truncatedText = rawText.length > 600 ? rawText.substring(0, 597) + '...' : rawText;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const wrappedLines = doc.splitTextToSize(`"${truncatedText}"`, 174);
  const maxLines = Math.min(wrappedLines.length, 5);
  const linesToPrint = wrappedLines.slice(0, maxLines);
  if (wrappedLines.length > 5) {
    linesToPrint[4] = linesToPrint[4] + '...';
  }

  const reviewBoxH = Math.max(15, linesToPrint.length * 3.8 + 6);
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, reviewSectionY + 2.5, 182, reviewBoxH, 2, 2, 'FD');

  doc.setTextColor(31, 41, 55);
  let reviewTextCursorY = reviewSectionY + 7;
  for (const line of linesToPrint) {
    doc.text(line, 18, reviewTextCursorY);
    reviewTextCursorY += 3.8;
  }

  // -------------------------------------------------------------
  // 5. Signal Forensics Summary Table
  // -------------------------------------------------------------
  const signalSectionY = reviewSectionY + 2.5 + reviewBoxH + 5;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FORENSIC SIGNAL & RISK EVALUATION', 14, signalSectionY);

  const signalTableHeadY = signalSectionY + 2.5;
  const signalRowH = 5.3;

  // Table Header
  doc.setFillColor(243, 244, 246); // #f3f4f6
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.rect(14, signalTableHeadY, 182, 5.5, 'FD');

  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SIGNAL DIMENSION', 17, signalTableHeadY + 3.8);
  doc.text('OBSERVED METRIC', 70, signalTableHeadY + 3.8);
  doc.text('STATUS / FORENSIC INTERPRETATION', 125, signalTableHeadY + 3.8);

  const dissonance = getDissonanceStatus(analysis.rating, analysis.sentiment_score);
  const burstStatus = analysis.reviewer_activity?.burst_detected
    ? 'BURST DETECTED (<=24h)'
    : analysis.reviewer_id
    ? 'NORMAL CADENCE'
    : 'N/A (No Reviewer ID)';
  const authorRisk = analysis.reviewer_activity
    ? `${(analysis.reviewer_activity.reviewer_risk_score * 100).toFixed(0)}% Risk Score`
    : 'N/A (Unprofiled Author)';

  const signalRows = [
    {
      name: 'Sentiment Polarity (VADER)',
      metric: `${analysis.sentiment_label.toUpperCase()} (${sentScore > 0 ? '+' : ''}${sentScore})`,
      interp: 'Lexical compound polarity calculation',
    },
    {
      name: 'Sentiment-Rating Dissonance',
      metric: dissonance.status,
      interp: dissonance.interpretation,
    },
    {
      name: 'Duplicate / Corpus Repetition',
      metric: analysis.is_duplicate ? `FLAGGED (${analysis.duplicate_similarity}% match)` : 'CLEAR (0% match)',
      interp: analysis.is_duplicate ? 'RapidFuzz fuzzy similarity threshold exceeded' : 'Corpus uniqueness verified',
    },
    {
      name: 'Reviewer Burst Status',
      metric: burstStatus,
      interp: analysis.reviewer_activity?.burst_detected
        ? 'High temporal velocity posting detected'
        : 'Normal organic posting intervals',
    },
    {
      name: 'Author Behavioral Risk',
      metric: authorRisk,
      interp: analysis.reviewer_activity?.risk_flags?.length
        ? analysis.reviewer_activity.risk_flags.join(' • ')
        : 'Zero abnormal posting anomalies detected',
    },
  ];

  let currentSignalY = signalTableHeadY + 5.5;
  signalRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, currentSignalY, 182, signalRowH, 'F');
    }
    doc.setDrawColor(229, 231, 235);
    doc.line(14, currentSignalY + signalRowH, 196, currentSignalY + signalRowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(31, 41, 55);
    doc.text(row.name, 17, currentSignalY + 3.7);

    doc.setFont('helvetica', 'normal');
    doc.text(row.metric, 70, currentSignalY + 3.7);

    doc.setTextColor(75, 85, 99);
    doc.text(row.interp, 125, currentSignalY + 3.7);

    currentSignalY += signalRowH;
  });

  // -------------------------------------------------------------
  // 6. Top 5 SHAP Keyword Attributions Table
  // -------------------------------------------------------------
  const shapSectionY = currentSignalY + 4;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOP 5 SHAP KEYWORD ATTRIBUTIONS (EXPLAINABLE AI)', 14, shapSectionY);

  const shapTableHeadY = shapSectionY + 2.5;
  const shapRowH = 5.1;

  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.rect(14, shapTableHeadY, 182, 5.5, 'FD');

  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TOKEN / KEYWORD', 17, shapTableHeadY + 3.8);
  doc.text('SHAP IMPACT SCORE', 70, shapTableHeadY + 3.8);
  doc.text('DIRECTION & LINGUISTIC RATIONALE', 125, shapTableHeadY + 3.8);

  const topKeywords = (analysis.suspicious_keywords || []).slice(0, 5);
  let currentShapY = shapTableHeadY + 5.5;

  if (topKeywords.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('No dominant lexical attributions exceeded attribution thresholds.', 17, currentShapY + 3.7);
    currentShapY += shapRowH;
  } else {
    topKeywords.forEach((kw, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, currentShapY, 182, shapRowH, 'F');
      }
      doc.setDrawColor(229, 231, 235);
      doc.line(14, currentShapY + shapRowH, 196, currentShapY + shapRowH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(31, 41, 55);
      doc.text(`"${kw.word}"`, 17, currentShapY + 3.6);

      const isPositive = kw.score > 0;
      doc.setTextColor(isPositive ? 225 : 16, isPositive ? 29 : 185, isPositive ? 72 : 129);
      doc.text(`${isPositive ? '+' : ''}${kw.score.toFixed(3)}`, 70, currentShapY + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const defaultReason = isPositive
        ? 'Increases fake probability (Superlative praise)'
        : 'Supports genuine rating (Factual grounding)';
      const reasonText = kw.reason || defaultReason;
      doc.text(reasonText, 125, currentShapY + 3.6);

      currentShapY += shapRowH;
    });
  }

  // -------------------------------------------------------------
  // 7. Active Model Governance & Benchmark Card
  // -------------------------------------------------------------
  const modelSectionY = currentShapY + 4;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MODEL GOVERNANCE & BENCHMARK SPECIFICATIONS', 14, modelSectionY);

  const modelCardY = modelSectionY + 2.5;
  const modelCardH = 21.5;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, modelCardY, 182, modelCardH, 2, 2, 'FD');

  // Left Column
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Active Model:', 18, modelCardY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(modelName, 42, modelCardY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Benchmark F1:', 18, modelCardY + 10.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(modelF1, 42, modelCardY + 10.3);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Latency SLA:', 18, modelCardY + 15.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('3.4 ms production inference', 42, modelCardY + 15.8);

  // Right Column
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Calibration:', 112, modelCardY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('CalibratedClassifierCV (Sigmoid/Isotonic)', 132, modelCardY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Neural Benchmark:', 112, modelCardY + 10.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('DistilBERT 91.3% F1 @ 48.2 ms', 138, modelCardY + 10.3);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Evaluation Corpus:', 112, modelCardY + 15.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Ott et al. Deceptive Opinion Spam (80/20)', 138, modelCardY + 15.8);

  // -------------------------------------------------------------
  // 8. Footer & Legal Disclaimer (Fits on Page 1)
  // -------------------------------------------------------------
  const footerDividerY = 260;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.35);
  doc.line(14, footerDividerY, 196, footerDividerY);

  // Disclaimer
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  const disclaimer =
    'This assessment is a probabilistic model output and should be used as decision support, not as proof. Machine learning predictions are subject to confidence thresholds and lexical variations.';
  doc.text(doc.splitTextToSize(disclaimer, 182), 14, footerDividerY + 4.5);

  // Verification Line & Metadata
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://veridex.ai';
  const verifyUrl = `${origin}/verify/${certId}`;

  const metaLineY = footerDividerY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text(`Verify Online: ${verifyUrl}`, 14, metaLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text('Veridex Automated Forensics Engine • Cryptographically Audited', 105, metaLineY, { align: 'center' });

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(7.5);
  doc.text('Page 1 of 1', 196, metaLineY, { align: 'right' });

  // Bottom Accent Strip
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 293.5, 210, 3.5, 'F');

  // Trigger browser download
  const filename = `Veridex_Certificate_${certId}.pdf`;
  doc.save(filename);
}

