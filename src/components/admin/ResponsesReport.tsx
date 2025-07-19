import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import type { QuizReport, QuizResponse, QuizAnswer } from '../../types/database';

interface DetailedResponse extends QuizResponse {
  answers: (QuizAnswer & { questions: { question_text: string } })[];
}

export const ResponsesReport: React.FC = () => {
  const [report, setReport] = useState<QuizReport | null>(null);
  const [responses, setResponses] = useState<DetailedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<DetailedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  // ESC key listener for modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedResponse) {
        setSelectedResponse(null);
      }
    };

    if (selectedResponse) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedResponse]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching quiz responses...');
      
      // First, try to get basic responses
      const { data: basicResponses, error: basicError } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Basic responses:', basicResponses, 'Error:', basicError);

      if (basicError) {
        console.error('Error fetching basic responses:', basicError);
        return;
      }

      if (!basicResponses || basicResponses.length === 0) {
        console.log('No responses found');
        setResponses([]);
        setReport({
          totalResponses: 0,
          ageDistribution: { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 },
          questionStats: {}
        });
        return;
      }

      // Try to get answers for each response
      const responsesWithAnswers: DetailedResponse[] = [];
      
      for (const response of basicResponses) {
        try {
          const { data: answers, error: answersError } = await supabase
            .from('quiz_answers')
            .select(`
              *,
              questions (question_text)
            `)
            .eq('response_id', response.id);

          if (answersError) {
            console.error('Error fetching answers for response', response.id, ':', answersError);
          }

          responsesWithAnswers.push({
            ...response,
            answers: answers || []
          });
        } catch (error) {
          console.error('Error processing response', response.id, ':', error);
          responsesWithAnswers.push({
            ...response,
            answers: []
          });
        }
      }

      setResponses(responsesWithAnswers);

      // Calculate analytics
      const ageDistribution = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46+': 0
      };

      basicResponses.forEach((response: QuizResponse) => {
        if (response.age <= 25) ageDistribution['18-25']++;
        else if (response.age <= 35) ageDistribution['26-35']++;
        else if (response.age <= 45) ageDistribution['36-45']++;
        else ageDistribution['46+']++;
      });

      // Calculate question statistics
      const questionStats: QuizReport['questionStats'] = {};
      responsesWithAnswers.forEach((response: DetailedResponse) => {
        response.answers?.forEach((answer: any) => {
          const questionText = answer.questions?.question_text;
          // Skip personal information questions from statistics
          const isPersonalInfo = questionText && (
            questionText.toLowerCase().includes('name') ||
            questionText.toLowerCase().includes('email') ||
            questionText.toLowerCase().includes('contact') ||
            questionText.toLowerCase().includes('phone')
          );
          
          if (questionText && !isPersonalInfo) {
            if (!questionStats[questionText]) {
              questionStats[questionText] = {};
            }
            if (!questionStats[questionText][answer.answer_text]) {
              questionStats[questionText][answer.answer_text] = 0;
            }
            questionStats[questionText][answer.answer_text]++;
          }
        });
      });

      setReport({
        totalResponses: basicResponses.length,
        ageDistribution,
        questionStats
      });

    } catch (error) {
      console.error('Error in fetchData:', error);
      setResponses([]);
      setReport({
        totalResponses: 0,
        ageDistribution: { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 },
        questionStats: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter(response =>
    response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.contact.includes(searchTerm)
  );

  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#1d0917]">Loading responses...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#1d0917]">Error loading data. Please try refreshing.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e9d6e4] bg-gradient-to-br from-[#913177] to-[#b8439a]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{report.totalResponses}</div>
            <div className="text-white/90 text-sm">Total Responses</div>
          </CardContent>
        </Card>
        
        <Card className="border-[#e9d6e4] bg-gradient-to-br from-[#4ade80] to-[#22c55e]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {responses.filter(r => {
                const today = new Date();
                const responseDate = new Date(r.created_at || '');
                return responseDate.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className="text-white/90 text-sm">Today's Responses</div>
          </CardContent>
        </Card>

        <Card className="border-[#e9d6e4] bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {responses.filter(r => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const responseDate = new Date(r.created_at || '');
                return responseDate >= weekAgo;
              }).length}
            </div>
            <div className="text-white/90 text-sm">This Week</div>
          </CardContent>
        </Card>

        <Card className="border-[#e9d6e4] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {Math.round(report.totalResponses > 0 ? (responses.filter(r => r.age >= 18 && r.age <= 35).length / report.totalResponses) * 100 : 0)}%
            </div>
            <div className="text-white/90 text-sm">Age 18-35</div>
          </CardContent>
        </Card>
      </div>

      {/* Age Distribution */}
      <Card className="border-[#e9d6e4] bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-[#1d0917] mb-4">Age Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.ageDistribution).map(([range, count]) => {
              const percentage = report.totalResponses > 0 ? (count / report.totalResponses) * 100 : 0;
              return (
                <div key={range} className="text-center">
                  <div className="bg-[#fff4fc] rounded-lg p-4 mb-2">
                    <div className="text-2xl font-bold text-[#913177] mb-1">{count}</div>
                    <div className="text-sm text-[#1d0917] mb-2">{range} years</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#913177] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-[#6d6d6e] mt-1">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Individual Responses */}
      <Card className="border-[#e9d6e4] bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold text-[#1d0917]">Individual Responses</h3>
            <div className="flex gap-4 w-full md:w-auto">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-[#913177] text-white hover:bg-[#913177]/90"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh'}
              </Button>
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-[#e9d6e4] w-full md:w-80"
              />
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc]"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Responses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e9d6e4]">
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Age</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#1d0917]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResponses.map((response) => (
                  <tr key={response.id} className="border-b border-[#f0f0f0] hover:bg-[#fff4fc] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#1d0917]">{response.name}</td>
                    <td className="py-3 px-4 text-[#3d3d3d]">{response.email}</td>
                    <td className="py-3 px-4 text-[#3d3d3d]">{response.contact}</td>
                    <td className="py-3 px-4 text-[#3d3d3d]">{response.age}</td>
                    <td className="py-3 px-4 text-[#3d3d3d]">{formatDate(response.created_at || '')}</td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => setSelectedResponse(response)}
                        className="bg-[#913177] text-white hover:bg-[#913177]/90 text-sm px-3 py-1"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedResponses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-[#6d6d6e]">
                      {searchTerm ? 'No responses found matching your search.' : 'No quiz responses found yet. Try taking the quiz first!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="border-[#e9d6e4]"
              >
                Previous
              </Button>
              <span className="text-[#1d0917]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="border-[#e9d6e4]"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Statistics */}
      {Object.keys(report.questionStats).length > 0 && (
        <Card className="border-[#e9d6e4] bg-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-[#1d0917] mb-6">Question Statistics</h3>
            <div className="space-y-6">
              {Object.entries(report.questionStats).map(([question, answers]) => (
                <div key={question} className="bg-[#fff4fc] rounded-lg p-4">
                  <h4 className="font-medium text-[#1d0917] mb-3">{question}</h4>
                  <div className="space-y-2">
                    {Object.entries(answers).map(([answer, count]) => {
                      const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={answer} className="flex items-center justify-between">
                          <span className="text-[#3d3d3d] text-sm flex-1 mr-4">{answer}</span>
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#913177] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-[#1d0917] text-sm min-w-[40px]">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedResponse(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedResponse(null);
            }
          }}
          tabIndex={-1}
        >
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-[#e9d6e4] bg-white relative">
            {/* Sticky Close Button */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-[#e9d6e4] flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-[#1d0917]">
                {selectedResponse.name}'s Response
              </h3>
              <Button
                onClick={() => setSelectedResponse(null)}
                variant="outline"
                className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc] shrink-0"
              >
                ✕ Close
              </Button>
            </div>
            
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="text-[#3d3d3d] space-y-1">
                  <p><strong>Email:</strong> {selectedResponse.email}</p>
                  <p><strong>Phone:</strong> {selectedResponse.contact}</p>
                  <p><strong>Age:</strong> {selectedResponse.age}</p>
                  <p><strong>Submitted:</strong> {formatDate(selectedResponse.created_at || '')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[#1d0917] border-b border-[#e9d6e4] pb-2">
                  Quiz Answers ({selectedResponse.answers?.length || 0} answers)
                </h4>
                {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                  selectedResponse.answers.map((answer, index) => (
                    <div key={answer.id} className="bg-[#fff4fc] rounded-lg p-4">
                      <div className="font-medium text-[#1d0917] mb-2">
                        Q{index + 1}: {answer.questions?.question_text || `Question ID: ${answer.question_id}`}
                      </div>
                      <div className="text-[#3d3d3d] mb-2">
                        <strong>Answer:</strong> {answer.answer_text}
                      </div>
                      {answer.additional_info && (
                        <div className="text-[#3d3d3d] bg-white rounded p-3 mt-2">
                          <strong>Additional Details:</strong> {answer.additional_info}
                        </div>
                      )}
                      {answer.file_url && (
                        <div className="text-[#3d3d3d] mt-2">
                          <strong>File:</strong> 
                          <a href={answer.file_url} target="_blank" rel="noopener noreferrer" className="text-[#913177] hover:underline ml-2 break-all">
                            📎 View uploaded file ({answer.file_url.split('/').pop()})
                          </a>
                          <div className="mt-1 text-xs text-[#6d6d6e]">
                            Click to download/view the uploaded document
                          </div>
                        </div>
                      )}
                      {!answer.file_url && answer.questions?.question_text?.toLowerCase().includes('blood test') && answer.answer_text.toLowerCase().includes('yes') && (
                        <div className="text-red-500 mt-2 text-sm font-medium">
                          ⚠️ Note: User indicated they have a blood test but no file was uploaded
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#6d6d6e]">
                    No detailed answers found for this response.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};