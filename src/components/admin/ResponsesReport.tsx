
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

export const ResponsesReport: React.FC = () => {
  const [report, setReport] = useState<QuizReport | null>(null);
  const [responses, setResponses] = useState<DetailedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<DetailedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'age'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      
      const { data: basicResponses, error: basicError } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (basicError && basicError.message?.includes('connection')) {
        console.warn('Network connection issue, using cached data if available');
      } else if (basicError) {
        console.log('Fetch error:', basicError);
      } else {
        console.log('✅ Successfully fetched', basicResponses?.length || 0, 'responses');
      }

      if (basicError) {
        console.error('Error fetching basic responses:', basicError);
        // Set empty data instead of returning early
        setResponses([]);
        setReport({
          totalResponses: 0,
          ageDistribution: { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 },
          questionStats: {}
        });
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

  // Enhanced filtering and sorting
  const filteredAndSortedResponses = React.useMemo(() => {
    let filtered = responses.filter(response => {
      const matchesSearch = response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.contact.includes(searchTerm);

      const matchesDateRange = (!dateRange.from || new Date(response.created_at || '') >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(response.created_at || '') <= new Date(dateRange.to + 'T23:59:59'));

      const matchesAge = !ageFilter || 
        (ageFilter === '18-25' && response.age >= 18 && response.age <= 25) ||
        (ageFilter === '26-35' && response.age >= 26 && response.age <= 35) ||
        (ageFilter === '36-45' && response.age >= 36 && response.age <= 45) ||
        (ageFilter === '46+' && response.age >= 46);

      return matchesSearch && matchesDateRange && matchesAge;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'age':
          comparison = a.age - b.age;
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [responses, searchTerm, dateRange, ageFilter, sortBy, sortOrder]);

  const paginatedResponses = filteredAndSortedResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedResponses.length / itemsPerPage);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Submission Date'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedResponses.map(response => [
        `"${response.name}"`,
        `"${response.email}"`,
        `"${response.contact}"`,
        response.age,
        `"${formatDate(response.created_at || '')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz_responses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
    setAgeFilter('');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="ml-4 text-lg text-[#1d0917]">Loading responses...</div>
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <Card className="border-none shadow-lg bg-white">
        <CardContent className="p-3 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1d0917] flex items-center">
                <span className="mr-2 sm:mr-3 text-sm sm:text-base">🗂️</span>
                <span className="text-sm sm:text-base lg:text-xl">Detailed Responses</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-[#913177] text-white hover:bg-[#913177]/90 shadow-md text-xs sm:text-sm px-3 py-2"
                >
                  {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="bg-[#4ade80] text-white hover:bg-[#22c55e] shadow-md text-xs sm:text-sm px-3 py-2"
                >
                  📥 Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-[#fff4fc] to-white rounded-xl">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#1d0917] mb-1 sm:mb-2">Search</label>
              <Input
                placeholder="Name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-[#e9d6e4] focus:border-[#913177] text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#1d0917] mb-1 sm:mb-2">From Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="border-[#e9d6e4] focus:border-[#913177] text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#1d0917] mb-1 sm:mb-2">To Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="border-[#e9d6e4] focus:border-[#913177] text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#1d0917] mb-1 sm:mb-2">Age Group</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full p-1 sm:p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none text-xs sm:text-sm h-8 sm:h-10"
              >
                <option value="">All Ages</option>
                <option value="18-25">18-25 years</option>
                <option value="26-35">26-35 years</option>
                <option value="36-45">36-45 years</option>
                <option value="46+">46+ years</option>
              </select>
            </div>
          </div>

          {/* Sort and Display Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[#1d0917]">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'age')}
                  className="p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="age">Age</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[#1d0917]">Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[#1d0917]">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc]"
            >
              🗑️ Clear All Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="mb-4 p-3 bg-[#f8f9fa] rounded-lg">
            <div className="text-sm text-[#6d6d6e]">
              Showing {paginatedResponses.length} of {filteredAndSortedResponses.length} responses
              {filteredAndSortedResponses.length !== responses.length && 
                ` (filtered from ${responses.length} total)`
              }
            </div>
          </div>

          {/* Enhanced Responses Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow-inner">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white">
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Name</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Email</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Age</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Answers</th>
                  <th className="text-left py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-bold text-xs sm:text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResponses.map((response, index) => (
                  <tr key={response.id} className={`border-b border-[#f0f0f0] hover:bg-gradient-to-r hover:from-[#fff4fc] hover:to-white transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6">
                      <div className="font-semibold text-[#1d0917] text-xs sm:text-sm truncate max-w-[120px]">{response.name}</div>
                    </td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 text-[#3d3d3d] text-xs sm:text-sm truncate max-w-[150px]">{response.email}</td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 text-[#3d3d3d] text-xs sm:text-sm">{response.contact}</td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6">
                      <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#913177]/10 text-[#913177]">
                        {response.age}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 text-[#3d3d3d] text-xs sm:text-sm">
                      <div className="max-w-[100px] truncate">{formatDate(response.created_at || '')}</div>
                    </td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6">
                      <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4ade80]/10 text-[#22c55e]">
                        {response.answers?.length || 0}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6">
                      <Button
                        onClick={() => setSelectedResponse(response)}
                        className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white hover:from-[#7a2463] hover:to-[#9a3687] text-xs sm:text-sm px-2 sm:px-3 lg:px-4 py-1 sm:py-2 shadow-md"
                      >
                        <span className="hidden sm:inline">👁️ View</span>
                        <span className="sm:hidden">👁️</span>
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedResponses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <div className="text-lg text-[#6d6d6e] mb-2">
                        {searchTerm || dateRange.from || dateRange.to || ageFilter ? 'No responses found matching your filters.' : 'No quiz responses found yet.'}
                      </div>
                      <div className="text-sm text-[#6d6d6e]">
                        {searchTerm || dateRange.from || dateRange.to || ageFilter ? 'Try adjusting your filters.' : 'Responses will appear here once users complete the quiz.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-sm text-[#6d6d6e]">
                Page {currentPage} of {totalPages} • {filteredAndSortedResponses.length} total responses
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-[#e9d6e4] text-sm px-3 py-1"
                >
                  ⏮️ First
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-[#e9d6e4] text-sm px-3 py-1"
                >
                  ◀️ Previous
                </Button>
                <span className="px-3 py-1 bg-[#913177] text-white rounded text-sm font-medium">
                  {currentPage}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-[#e9d6e4] text-sm px-3 py-1"
                >
                  Next ▶️
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-[#e9d6e4] text-sm px-3 py-1"
                >
                  Last ⏭️
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Enhanced Response Detail Modal */}
      {selectedResponse && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
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
          <Card className="max-w-5xl w-full max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-white relative animate-in slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#913177] to-[#b8439a] text-white z-10 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  👤 {selectedResponse.name}'s Response
                </h3>
                <p className="text-white/90 text-sm mt-1">
                  Submitted on {formatDate(selectedResponse.created_at || '')}
                </p>
              </div>
              <Button
                onClick={() => setSelectedResponse(null)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 shrink-0"
              >
                ✕ Close
              </Button>
            </div>
            
            <CardContent className="p-8">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-[#fff4fc] to-white rounded-xl p-6 shadow-md">
                  <h4 className="text-lg font-bold text-[#1d0917] mb-4 flex items-center">
                    <span className="mr-2">📞</span>Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Email:</span>
                      <span className="text-[#3d3d3d] ml-2">{selectedResponse.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Phone:</span>
                      <span className="text-[#3d3d3d] ml-2">{selectedResponse.contact}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Age:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#913177]/10 text-[#913177] ml-2">
                        {selectedResponse.age} years
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#f0f9ff] to-white rounded-xl p-6 shadow-md">
                  <h4 className="text-lg font-bold text-[#1d0917] mb-4 flex items-center">
                    <span className="mr-2">📊</span>Response Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-20">Answers:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#4ade80]/10 text-[#22c55e] ml-2">
                        {selectedResponse.answers?.length || 0} questions
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-20">Files:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#f59e0b]/10 text-[#d97706] ml-2">
                        {selectedResponse.answers?.filter(a => a.file_url).length || 0} uploaded
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Answers */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-[#1d0917] border-b-2 border-[#e9d6e4] pb-3 flex items-center">
                  <span className="mr-3">💬</span>Quiz Answers
                  <span className="ml-auto text-sm font-normal text-[#6d6d6e]">
                    ({selectedResponse.answers?.length || 0} responses)
                  </span>
                </h4>
                
                {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                  <div className="grid gap-6">
                    {selectedResponse.answers.map((answer, index) => (
                      <div key={answer.id} className="bg-gradient-to-r from-[#fff4fc] to-white rounded-xl p-6 shadow-md border-l-4 border-[#913177]">
                        <div className="font-bold text-[#1d0917] mb-3 text-lg">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-[#913177] text-white rounded-full text-sm font-bold mr-3">
                            {index + 1}
                          </span>
                          {answer.questions?.question_text || `Question ID: ${answer.question_id}`}
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                          <div className="font-semibold text-[#1d0917] mb-2 flex items-center">
                            <span className="mr-2">💡</span>Answer:
                          </div>
                          <div className="text-[#3d3d3d] text-lg">{answer.answer_text}</div>
                        </div>

                        {answer.additional_info && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="font-semibold text-blue-700 mb-2 flex items-center">
                              <span className="mr-2">📝</span>Additional Details:
                            </div>
                            <div className="text-blue-800">{answer.additional_info}</div>
                          </div>
                        )}

                        {answer.file_url && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="font-semibold text-green-700 mb-3 flex items-center">
                              <span className="mr-2">📎</span>Uploaded File:
                            </div>
                            <a 
                              href={answer.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-2 bg-[#913177] text-white px-4 py-2 rounded-lg hover:bg-[#7a2463] transition-colors font-medium"
                            >
                              <span>🔗</span>
                              <span>{answer.file_url.split('/').pop()}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15,3 21,3 21,9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                            <div className="text-sm text-green-600 mt-2">
                              Click to view or download the uploaded document
                            </div>
                          </div>
                        )}

                        {!answer.file_url && (answer.questions?.question_text?.toLowerCase().includes('blood test') || answer.questions?.question_text?.toLowerCase().includes('upload')) && answer.answer_text.toLowerCase().includes('yes') && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-700 font-semibold flex items-center">
                              <span className="mr-2">⚠️</span>Missing File Upload
                            </div>
                            <div className="text-red-600 text-sm mt-1">
                              User indicated they have a file to upload but no file was uploaded
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <div className="text-lg text-[#6d6d6e] mb-2">No detailed answers found</div>
                    <div className="text-sm text-[#6d6d6e]">This response doesn't contain any quiz answers.</div>
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
