
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import type { QuizReport, QuizResponse, QuizAnswer } from '../../types/database';

interface DetailedResponse extends QuizResponse {
  answers: (QuizAnswer & { questions: { question_text: string } })[];
}

interface DateRange {
  from: string;
  to: string;
}

export const AnalyticsReport: React.FC = () => {
  const [report, setReport] = useState<QuizReport | null>(null);
  const [responses, setResponses] = useState<DetailedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: getDateWeekAgo(), 
    to: getCurrentDate() 
  });

  // Helper functions for default date range
  function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getDateWeekAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');

      // Build query with date filtering
      let query = supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from + 'T00:00:00');
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to + 'T23:59:59');
      }

      const { data: basicResponses, error: basicError } = await query;

      if (basicError) {
        console.error('Error fetching basic responses:', basicError);
        setResponses([]);
        setReport({
          totalResponses: 0,
          ageDistribution: { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 },
          questionStats: {}
        });
        setLoading(false);
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
        setLoading(false);
        return;
      }

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

      // Calculate enhanced analytics
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

      const questionStats: QuizReport['questionStats'] = {};
      responsesWithAnswers.forEach((response: DetailedResponse) => {
        response.answers?.forEach((answer: any) => {
          const questionText = answer.questions?.question_text;
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
      console.error('Error in fetchAnalyticsData:', error);
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

  const clearFilters = () => {
    setDateRange({ from: getDateWeekAgo(), to: getCurrentDate() });
  };

  // Calculate advanced statistics
  const advancedStats = React.useMemo(() => {
    if (!responses.length) return null;

    const avgAge = Math.round(responses.reduce((sum, r) => sum + r.age, 0) / responses.length);
    const avgResponseTime = responses.reduce((sum, r) => {
      const responseTime = r.answers?.length || 0;
      return sum + responseTime;
    }, 0) / responses.length;

    const last30Days = responses.filter(r => {
      const responseDate = new Date(r.created_at || '');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return responseDate >= thirtyDaysAgo;
    }).length;

    const responsesByDay = responses.reduce((acc: Record<string, number>, response) => {
      const date = new Date(response.created_at || '').toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const peakDay = Object.entries(responsesByDay).reduce((max, [date, count]) => 
      count > max.count ? { date, count } : max, { date: '', count: 0 });

    return { avgAge, avgResponseTime: Math.round(avgResponseTime), last30Days, peakDay };
  }, [responses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#913177]"></div>
        <div className="ml-4 text-lg text-[#1d0917]">Loading analytics...</div>
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
    <div className="space-y-8">
      {/* Date Range Filter */}
      <Card className="border-none shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-[#1d0917] flex items-center">
              <span className="mr-3">📊</span>Analytics & Reports
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-[#913177] text-white hover:bg-[#913177]/90 shadow-md text-sm"
              >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-[#fff4fc] to-white rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-[#1d0917] mb-2">From Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="border-[#e9d6e4] focus:border-[#913177]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1d0917] mb-2">To Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="border-[#e9d6e4] focus:border-[#913177]"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc] w-full"
              >
                🗑️ Reset to Current Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-[#913177] to-[#b8439a] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">{report.totalResponses}</div>
                <div className="text-white/90 text-sm font-medium">Total Responses</div>
              </div>
              <div className="text-4xl opacity-50">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-[#4ade80] to-[#22c55e] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">
                  {responses.filter(r => {
                    const today = new Date();
                    const responseDate = new Date(r.created_at || '');
                    return responseDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="text-white/90 text-sm font-medium">Today's Responses</div>
              </div>
              <div className="text-4xl opacity-50">📅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">{advancedStats?.avgAge || 0}</div>
                <div className="text-white/90 text-sm font-medium">Average Age</div>
              </div>
              <div className="text-4xl opacity-50">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">{advancedStats?.last30Days || 0}</div>
                <div className="text-white/90 text-sm font-medium">Last 30 Days</div>
              </div>
              <div className="text-4xl opacity-50">📈</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Statistics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Distribution */}
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-[#1d0917] mb-6 flex items-center">
              <span className="mr-3">📊</span>Age Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(report.ageDistribution).map(([range, count]) => {
                const percentage = report.totalResponses > 0 ? (count / report.totalResponses) * 100 : 0;
                return (
                  <div key={range} className="bg-gradient-to-r from-[#fff4fc] to-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-[#1d0917]">{range} years</span>
                      <span className="text-2xl font-bold text-[#913177]">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-[#913177] to-[#b8439a] h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-[#6d6d6e] text-right">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insights Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe]">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-[#1d0917] mb-6 flex items-center">
              <span className="mr-3">💡</span>Quick Insights
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-[#4ade80]">
                <div className="text-sm text-[#6d6d6e]">Peak Response Day</div>
                <div className="font-bold text-[#1d0917]">
                  {advancedStats?.peakDay.date ? new Date(advancedStats.peakDay.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }) : 'N/A'}
                </div>
                <div className="text-sm text-[#4ade80]">{advancedStats?.peakDay.count || 0} responses</div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-[#f59e0b]">
                <div className="text-sm text-[#6d6d6e]">Average Questions Answered</div>
                <div className="font-bold text-[#1d0917]">{advancedStats?.avgResponseTime || 0}</div>
                <div className="text-sm text-[#f59e0b]">per response</div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-[#8b5cf6]">
                <div className="text-sm text-[#6d6d6e]">Response Rate Trend</div>
                <div className="font-bold text-[#1d0917]">
                  {responses.length > 1 ? '+' : ''}{Math.round(((advancedStats?.last30Days || 0) / 30) * 100) / 100} per day
                </div>
                <div className="text-sm text-[#8b5cf6]">last 30 days</div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-[#ef4444]">
                <div className="text-sm text-[#6d6d6e]">Completion Rate</div>
                <div className="font-bold text-[#1d0917]">
                  {report.totalResponses > 0 ? Math.round((responses.filter(r => r.status === 'completed').length / report.totalResponses) * 100) : 0}%
                </div>
                <div className="text-sm text-[#ef4444]">completed vs partial</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Question Statistics */}
      {Object.keys(report.questionStats).length > 0 && (
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-[#1d0917] mb-8 flex items-center">
              <span className="mr-3">📈</span>Question Analytics
            </h3>
            <div className="grid gap-8">
              {Object.entries(report.questionStats).map(([question, answers], index) => (
                <div key={question} className="bg-gradient-to-r from-[#fff4fc] to-white rounded-xl p-6 shadow-md">
                  <h4 className="font-bold text-[#1d0917] mb-4 text-lg">
                    Q{index + 1}: {question}
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(answers).map(([answer, count]) => {
                      const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={answer} className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[#3d3d3d] font-medium flex-1 mr-4">{answer}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#913177] text-lg">
                                {count}
                              </span>
                              <span className="text-sm text-[#6d6d6e] min-w-[50px]">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-[#913177] to-[#b8439a] h-3 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${percentage}%` }}
                            ></div>
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
    </div>
  );
};
