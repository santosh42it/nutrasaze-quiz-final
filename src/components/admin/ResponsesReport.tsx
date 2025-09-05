import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import type { QuizResponse, QuizAnswer } from '../../types/database';

interface DetailedResponse extends QuizResponse {
  answers: (QuizAnswer & { questions: { question_text: string } })[];
}

interface DateRange {
  from: string;
  to: string;
}

export const ResponsesReport: React.FC = () => {
  const [responses, setResponses] = useState<DetailedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<DetailedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: getDateWeekAgo(), 
    to: getCurrentDate() 
  });
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'age'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'partial'>('all');

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
    fetchResponses();
  }, [dateRange, statusFilter]);

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
    await fetchResponses();
    setRefreshing(false);
  };

  const fetchResponses = async () => {
    try {
      setLoading(true);
      console.log('Fetching quiz responses with date filter...');

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

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: basicResponses, error: basicError } = await query;

      console.log('Basic responses:', basicResponses, 'Error:', basicError);

      if (basicError) {
        console.error('Error fetching basic responses:', basicError);
        setResponses([]);
        setLoading(false);
        return;
      }

      if (!basicResponses || basicResponses.length === 0) {
        console.log('No responses found');
        setResponses([]);
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

    } catch (error) {
      console.error('Error in fetchResponses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedResponses = React.useMemo(() => {
    let filtered = responses.filter(response => {
      const matchesSearch = (response.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (response.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (response.contact || '').includes(searchTerm);

      const matchesAge = !ageFilter || 
        (ageFilter === '18-25' && response.age >= 18 && response.age <= 25) ||
        (ageFilter === '26-35' && response.age >= 26 && response.age <= 35) ||
        (ageFilter === '36-45' && response.age >= 36 && response.age <= 45) ||
        (ageFilter === '46+' && response.age >= 46);

      return matchesSearch && matchesAge;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'age':
          comparison = (a.age || 0) - (b.age || 0);
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [responses, searchTerm, ageFilter, sortBy, sortOrder]);

  const paginatedResponses = filteredAndSortedResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedResponses.length / itemsPerPage);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Status', 'Submission Date'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedResponses.map(response => [
        `"${response.name || '-'}"`,
        `"${response.email || '-'}"`,
        `"${response.contact || '-'}"`,
        response.age || '-',
        response.status || 'completed',
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
    setDateRange({ from: getDateWeekAgo(), to: getCurrentDate() });
    setAgeFilter('');
    setSortBy('date');
    setSortOrder('desc');
    setStatusFilter('all');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#913177]"></div>
        <div className="ml-4 text-lg text-[#1d0917]">Loading responses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-[#913177] to-[#b8439a] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">{responses.length}</div>
                <div className="text-white/90 text-sm font-medium">Filtered Responses</div>
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
                  {responses.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-white/90 text-sm font-medium">Completed</div>
              </div>
              <div className="text-4xl opacity-50">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-2">
                  {responses.filter(r => r.status === 'partial').length}
                </div>
                <div className="text-white/90 text-sm font-medium">Partial</div>
              </div>
              <div className="text-4xl opacity-50">⏳</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white overflow-hidden relative">
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
                <div className="text-white/90 text-sm font-medium">Today</div>
              </div>
              <div className="text-4xl opacity-50">📅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <Card className="border-none shadow-lg bg-white">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-2xl font-bold text-[#1d0917] flex items-center">
              <span className="mr-2 sm:mr-3">🗂️</span>Quiz Responses
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-[#913177] text-white hover:bg-[#913177]/90 shadow-md text-sm"
              >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
              </Button>
              <Button
                onClick={exportToCSV}
                className="bg-[#4ade80] text-white hover:bg-[#22c55e] shadow-md text-sm"
              >
                📥 Export CSV
              </Button>
            </div>
          </div>

          {/* Date Range and Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-6 bg-gradient-to-r from-[#fff4fc] to-white rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-[#1d0917] mb-2">Search</label>
              <Input
                placeholder="Name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-[#e9d6e4] focus:border-[#913177]"
              />
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-[#1d0917] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'partial')}
                className="w-full p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1d0917] mb-2">Age Group</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full p-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
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
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white">
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Name</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Age</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Date</th>
                  <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResponses.map((response, index) => (
                  <tr key={response.id} className={`border-b border-[#f0f0f0] hover:bg-gradient-to-r hover:from-[#fff4fc] hover:to-white transition-all duration-200 ${response.status === 'partial' ? 'bg-yellow-50' : (index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white')}`}>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#1d0917]">{response.name || '-'}</div>
                    </td>
                    <td className="py-4 px-6 text-[#3d3d3d]">{response.email || '-'}</td>
                    <td className="py-4 px-6 text-[#3d3d3d]">{response.contact || '-'}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#913177]/10 text-[#913177]">
                        {response.age || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        response.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : response.status === 'partial' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {response.status === 'partial' ? 'Partial' : response.status === 'completed' ? 'Completed' : 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#3d3d3d] text-sm">{formatDate(response.created_at || '')}</td>
                    <td className="py-4 px-6">
                      <Button
                        onClick={() => setSelectedResponse(response)}
                        className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white hover:from-[#7a2463] hover:to-[#9a3687] text-sm px-4 py-2 shadow-md"
                      >
                        👁️ View Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedResponses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <div className="text-lg text-[#6d6d6e] mb-2">
                        {searchTerm || dateRange.from || dateRange.to || ageFilter || statusFilter !== 'all' ? 'No responses found matching your filters.' : 'No quiz responses found yet.'}
                      </div>
                      <div className="text-sm text-[#6d6d6e]">
                        {searchTerm || dateRange.from || dateRange.to || ageFilter || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Responses will appear here once users complete the quiz.'}
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
                  👤 {selectedResponse.name || 'Unknown'}'s Response
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
                      <span className="text-[#3d3d3d] ml-2">{selectedResponse.email || '-'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Phone:</span>
                      <span className="text-[#3d3d3d] ml-2">{selectedResponse.contact || '-'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Age:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#913177]/10 text-[#913177] ml-2">
                        {selectedResponse.age || '-'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#6d6d6e] w-16">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                        selectedResponse.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedResponse.status === 'partial' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedResponse.status === 'partial' ? 'Partial' : selectedResponse.status === 'completed' ? 'Completed' : 'Unknown'}
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
                    {selectedResponse.answers.filter((answer) => {
                      const questionText = answer.questions?.question_text?.toLowerCase() || '';
                      // Filter out personal information questions
                      const isPersonalInfo = questionText.includes('name') ||
                                            questionText.includes('email') ||
                                            questionText.includes('contact') ||
                                            questionText.includes('phone') ||
                                            questionText.includes('gender') ||
                                            questionText.includes('age') ||
                                            questionText.includes('male') ||
                                            questionText.includes('female');
                      return !isPersonalInfo;
                    }).map((answer, index) => (
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
                          <div className="text-[#3d3d3d] text-lg">{answer.answer_text || '-'}</div>
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
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                            <div className="text-sm text-green-600 mt-2">
                              Click to view or download the uploaded document
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