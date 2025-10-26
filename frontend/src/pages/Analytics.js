import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, AlertTriangle, ArrowUp, ArrowDown, Info, FileText, Apple, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import './Analytics.css';

const Analytics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportId = searchParams.get('report');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abnormalities, setAbnormalities] = useState([]);

  useEffect(() => {
    if (reportId) {
      fetchReportAnalysis();
    }
  }, [reportId]);

  const fetchReportAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/nutrition/lab-reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse ai_summary if it's a JSON string containing the full response
        let parsedData = { ...data };
        if (data.ai_summary && typeof data.ai_summary === 'string') {
          const trimmed = data.ai_summary.trim();
          
          // Check if it starts with ```json or just {
          if (trimmed.startsWith('```json')) {
            // Remove markdown code block
            const jsonContent = trimmed.replace(/```json\n?/g, '').replace(/```/g, '');
            try {
              const parsed = JSON.parse(jsonContent);
              parsedData.ai_summary = parsed.summary || '';
              parsedData.recommendations = parsed.recommendations || data.recommendations;
              parsedData.risk_factors = parsed.risk_factors || data.risk_factors;
              if (parsed.abnormalities) {
                parsedData.abnormalities = JSON.stringify(parsed.abnormalities);
              }
            } catch (e) {
              console.log('Failed to parse markdown JSON:', e);
            }
          } else if (trimmed.startsWith('{')) {
            // Try to parse as JSON directly
            try {
              const parsed = JSON.parse(trimmed);
              parsedData.ai_summary = parsed.summary || '';
              parsedData.recommendations = parsed.recommendations || data.recommendations;
              parsedData.risk_factors = parsed.risk_factors || data.risk_factors;
              if (parsed.abnormalities) {
                parsedData.abnormalities = JSON.stringify(parsed.abnormalities);
              }
            } catch (e) {
              console.log('Failed to parse JSON:', e);
            }
          } else if (trimmed.includes('"summary"')) {
            // Try to extract JSON from within the string
            const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                parsedData.ai_summary = parsed.summary || '';
                parsedData.recommendations = parsed.recommendations || data.recommendations;
                parsedData.risk_factors = parsed.risk_factors || data.risk_factors;
                if (parsed.abnormalities) {
                  parsedData.abnormalities = JSON.stringify(parsed.abnormalities);
                }
              } catch (e) {
                console.log('Failed to extract and parse JSON:', e);
              }
            }
          }
        }
        
        setReport(parsedData);
        
        // Parse abnormalities if available
        if (parsedData.abnormalities) {
          try {
            const parsed = typeof parsedData.abnormalities === 'string' 
              ? JSON.parse(parsedData.abnormalities) 
              : parsedData.abnormalities;
            setAbnormalities(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setAbnormalities([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    if (status === 'high') return <ArrowUp size={20} className="status-icon high" />;
    if (status === 'low') return <ArrowDown size={20} className="status-icon low" />;
    return <Info size={20} className="status-icon normal" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="analytics-container">
          <div className="loading-state">Loading analysis...</div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="analytics-container">
          <Card className="empty-state">
            <FileText size={64} />
            <h3>Report Not Found</h3>
            <Button onClick={() => navigate('/health-records')}>
              Go to Health Records
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="analytics-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="page-header">
            <div>
              <h1>
                <BarChart3 size={32} />
                Lab Report Analysis
              </h1>
              <p>{report.report_name}</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/health-records')}>
              Back to Records
            </Button>
          </div>

          {report.uploaded_at && (
            <div className="report-date-badge">
              <Calendar size={16} />
              <span>Uploaded: {formatDate(report.uploaded_at)}</span>
            </div>
          )}

          {report.next_test_date && (
            <div className="next-test-badge">
              <Calendar size={16} />
              <span>📅 Next Test Recommended: {formatDate(report.next_test_date)}</span>
            </div>
          )}

          {/* AI Summary */}
          {report.ai_summary && (
            <Card className="summary-card">
              <h2>AI Summary</h2>
              <p>{report.ai_summary}</p>
            </Card>
          )}

          {/* Abnormalities Section */}
          {abnormalities.length > 0 && (
            <Card className="abnormalities-card">
              <div className="card-header">
                <h2>
                  <AlertTriangle size={24} />
                  Abnormal Findings
                </h2>
                <span className="badge">{abnormalities.length} {abnormalities.length === 1 ? 'issue' : 'issues'} found</span>
              </div>

              <div className="abnormalities-grid">
                {abnormalities.map((abnormality, index) => (
                  <div key={index} className={`abnormality-card ${abnormality.status}`}>
                    <div className="abnormality-header">
                      <div>
                        {getStatusIcon(abnormality.status)}
                        <h3>{abnormality.parameter}</h3>
                      </div>
                      <span className={`status-badge ${abnormality.status}`}>
                        {abnormality.status.toUpperCase()}
                      </span>
                    </div>

                    {abnormality.value && (
                      <div className="abnormality-value">
                        <strong>Value:</strong> {abnormality.value}
                      </div>
                    )}

                    {abnormality.normal_range && (
                      <div className="abnormality-detail">
                        <strong>Normal Range:</strong> {abnormality.normal_range}
                      </div>
                    )}

                    {abnormality.reason && (
                      <div className="abnormality-section">
                        <h4>Possible Reasons:</h4>
                        <p>{abnormality.reason}</p>
                      </div>
                    )}

                    {abnormality.importance && (
                      <div className="abnormality-section">
                        <h4>Why It's Important:</h4>
                        <p>{abnormality.importance}</p>
                      </div>
                    )}

                    {abnormality.risks && (
                      <div className="abnormality-section risks">
                        <h4>Health Risks:</h4>
                        <p>{abnormality.risks}</p>
                      </div>
                    )}

                    {abnormality.next_test_days && (
                      <div className="next-test-info">
                        <Calendar size={16} />
                        <span>Recommended retest in {abnormality.next_test_days} days</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="meal-plan-cta">
                <Button onClick={() => navigate('/nutrition')}>
                  <Apple size={20} />
                  View Personalized Meal Plan
                </Button>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <Card className="recommendations-card">
              <h2>Recommendations</h2>
              <div className="recommendations-content">
                {report.recommendations}
              </div>
            </Card>
          )}

          {/* Risk Factors */}
          {report.risk_factors && (
            <Card className="risk-factors-card">
              <h2>
                <AlertTriangle size={24} />
                Risk Factors
              </h2>
              <div className="risk-factors-content">
                {report.risk_factors}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Analytics;
