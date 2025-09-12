import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { SecureFileViewer } from './SecureFileViewer';

// Response status badge component
const StatusBadge: React.FC<{ status: 'completed' | 'partial' }> = ({ status }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${
    status === 'completed' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }`}>
    {status === 'completed' ? '✅ Completed' : '⏳ Partial'}
  </span>
);

// Filter and action toolbar component
const ResponsesToolbar: React.FC = () => {
  const {
    responsesFilters,
    setResponsesFilters,
    clearResponsesFilters,
    refreshResponses,
    exportResponsesCSV,
    responsesLoading,
    responsesPagination,
    setResponsesPageSize
  } = useAdminStore();

  const [localSearch, setLocalSearch] = useState(responsesFilters.search);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setResponsesFilters({ search: value });
    }, 300);
    setSearchTimeout(timeout);
  };

  const activeFiltersCount = [
    responsesFilters.status !== 'all',
    responsesFilters.search.trim().length > 0,
    responsesFilters.dateFrom,
    responsesFilters.dateTo
  ].filter(Boolean).length;

  return (
    <Card className="border-none shadow-lg bg-white mb-6">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-[#1d0917] flex items-center">
              🗂️ Quiz Responses
            </h3>
            {activeFiltersCount > 0 && (
              <span className="bg-[#913177] text-white px-2 py-1 rounded-full text-xs font-medium">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={refreshResponses}
              disabled={responsesLoading}
              variant="outline"
              className="border-[#913177] text-[#913177] hover:bg-[#913177]/10"
            >
              {responsesLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </Button>
            <Button
              onClick={exportResponsesCSV}
              disabled={responsesLoading}
              className="bg-[#4ade80] text-white hover:bg-[#22c55e] shadow-md"
            >
              📥 Export CSV
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-[#fff4fc] to-white rounded-xl">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-[#1d0917] mb-2">Search</label>
            <Input
              placeholder="Name, email, or phone..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-[#e9d6e4] focus:border-[#913177]"
            />
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-semibold text-[#1d0917] mb-2">Status</label>
            <select
              value={responsesFilters.status}
              onChange={(e) => setResponsesFilters({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
            >
              <option value="all">All Responses</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-sm font-semibold text-[#1d0917] mb-2">Date From</label>
            <Input
              type="date"
              value={responsesFilters.dateFrom || ''}
              onChange={(e) => setResponsesFilters({ dateFrom: e.target.value || undefined })}
              className="border-[#e9d6e4] focus:border-[#913177]"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-sm font-semibold text-[#1d0917] mb-2">Date To</label>
            <Input
              type="date"
              value={responsesFilters.dateTo || ''}
              onChange={(e) => setResponsesFilters({ dateTo: e.target.value || undefined })}
              className="border-[#e9d6e4] focus:border-[#913177]"
            />
          </div>

          {/* Page size */}
          <div>
            <label className="block text-sm font-semibold text-[#1d0917] mb-2">Per Page</label>
            <select
              value={responsesPagination.pageSize}
              onChange={(e) => setResponsesPageSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#e9d6e4] rounded-md focus:border-[#913177] focus:outline-none"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={clearResponsesFilters}
              variant="outline"
              className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc]"
              disabled={responsesLoading}
            >
              🗑️ Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bulk actions bar that appears when responses are selected
const BulkActionsBar: React.FC<{ superAdminEnabled: boolean }> = ({ superAdminEnabled }) => {
  const {
    selectedResponses,
    clearResponseSelection,
    bulkDeleteResponses,
    bulkActionLoading
  } = useAdminStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (selectedResponses.size === 0) return null;

  const handleBulkDelete = async () => {
    if (!superAdminEnabled) return;
    try {
      await bulkDeleteResponses([...selectedResponses]);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="shadow-2xl border-[#913177] bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#1d0917]">
              {selectedResponses.size} response{selectedResponses.size > 1 ? 's' : ''} selected
            </span>
            
            <div className="flex gap-2">
              <Button
                onClick={clearResponseSelection}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
              
              {superAdminEnabled && (
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                    size="sm"
                    disabled={bulkActionLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {bulkActionLoading ? '⏳ Deleting...' : `🗑️ Delete ${selectedResponses.size}`}
                  </Button>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedResponses.size} Responses</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedResponses.size} response{selectedResponses.size > 1 ? 's' : ''}? 
                        This action cannot be undone and will permanently remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={bulkActionLoading}
                      >
                        {bulkActionLoading ? 'Deleting...' : 'Delete All'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Load more button component
const LoadMoreButton: React.FC = () => {
  const { responsesPagination, responsesLoading, loadMoreResponses } = useAdminStore();

  if (!responsesPagination.hasMore) return null;

  return (
    <div className="text-center py-6">
      <Button
        onClick={loadMoreResponses}
        disabled={responsesLoading}
        variant="outline"
        className="border-[#913177] text-[#913177] hover:bg-[#913177]/10"
      >
        {responsesLoading ? '⏳ Loading...' : '📄 Load More'}
      </Button>
    </div>
  );
};

// Response detail modal
const ResponseDetailModal: React.FC<{ 
  response: any; 
  onClose: () => void; 
  onDelete: (id: string) => void; 
  superAdminEnabled: boolean 
}> = ({ response, onClose, onDelete, superAdminEnabled }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-white relative animate-in slide-in-from-bottom-4 duration-300">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#913177] to-[#b8439a] text-white z-10 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">
              👤 {response.name || 'Unknown'}'s Response
            </h3>
            <p className="text-white/90 text-sm mt-1">
              Submitted on {formatDate(response.created_at || '')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {superAdminEnabled && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-red-500/20 hover:border-red-300"
                >
                  🗑️ Delete
                </Button>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Response</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {response.name}'s response? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDelete(response.id);
                        setDeleteDialogOpen(false);
                        onClose();
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              ✕ Close
            </Button>
          </div>
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
                  <span className="text-[#1d0917]">{response.email || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-[#6d6d6e] w-16">Phone:</span>
                  <span className="text-[#1d0917]">{response.contact || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-[#6d6d6e] w-16">Age:</span>
                  <span className="text-[#1d0917]">{response.age || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#fff4fc] to-white rounded-xl p-6 shadow-md">
              <h4 className="text-lg font-bold text-[#1d0917] mb-4 flex items-center">
                <span className="mr-2">📊</span>Submission Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-semibold text-[#6d6d6e] w-20">Status:</span>
                  <StatusBadge status={response.status} />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-[#6d6d6e] w-20">Submitted:</span>
                  <span className="text-[#1d0917]">{formatDate(response.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-[#6d6d6e] w-20">Updated:</span>
                  <span className="text-[#1d0917]">{formatDate(response.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Answers - Filter out basic info questions */}
          {(() => {
            // Filter out basic info questions by question_id (4-7 are name, email, contact, age)
            const quizAnswers = response.answers
              ?.filter((answer: any) => {
                // Filter out basic info questions (orders 1-4: name, contact, email, age)
                const questionOrder = Number(answer.questions?.order_index) || 0;
                return questionOrder > 4; // Keep questions from order 5 onwards (gender, stress, energy, etc.)
              })
              ?.sort((a: any, b: any) => {
                // Sort by question order_index from database for proper ordering
                const aOrder = Number(a.questions?.order_index) || 0;
                const bOrder = Number(b.questions?.order_index) || 0;
                return aOrder - bOrder;
              }) || [];

            return quizAnswers.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e9d6e4] overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white p-5">
                  <h4 className="text-xl font-bold flex items-center">
                    <span className="mr-3">🎯</span>Health Assessment Answers ({quizAnswers.length})
                  </h4>
                  <p className="text-white/90 text-sm mt-1">Detailed responses to personalized health questions</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {quizAnswers.map((answer: any, index: number) => (
                    <div key={answer.question_id || index} className="p-6 border-b border-[#f0f0f0] last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <div className="mb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-[#913177] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1d0917] text-base leading-relaxed">
                              {answer.questions?.question_text || `Question ID ${answer.question_id}`}
                            </h5>
                          </div>
                        </div>
                      </div>
                      
                      {/* Answer text */}
                      <div className="ml-9">
                        <div className="bg-gradient-to-r from-[#f8f9fa] to-white p-4 rounded-xl border border-gray-200 mb-4">
                          <div className="text-[#2d3748] font-medium">
                            {answer.answer_text || 'No answer provided'}
                          </div>
                          
                          {/* Show additional text area info if available */}
                          {answer.additional_info && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm font-semibold text-blue-900 mb-1">💬 Additional Details:</p>
                              <p className="text-blue-800">{answer.additional_info}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Secure File attachment - separate section outside answer text box */}
                        {answer.file_url && answer.file_url.trim() && (
                          <div className="ml-9 mt-4">
                            <SecureFileViewer 
                              filePath={answer.file_url}
                              fileName={answer.file_url.split('/').pop()}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

interface ResponsesReportProps {
  superAdminEnabled: boolean;
}

export const ResponsesReport: React.FC<ResponsesReportProps> = ({ superAdminEnabled }) => {
  const {
    responses,
    responsesLoading,
    responsesError,
    responsesTotalCount,
    selectedResponses,
    fetchResponses,
    toggleResponseSelection,
    selectAllResponses,
    clearResponseSelection,
    deleteResponse,
    getResponseDetails
  } = useAdminStore();
  
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Initialize responses on mount
  useEffect(() => {
    fetchResponses(true);
  }, []);

  const handleResponseClick = async (responseId: string) => {
    const details = await getResponseDetails(responseId);
    if (details) {
      setSelectedResponse(details);
    }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      await deleteResponse(id);
      setDeleteConfirmId(null); // Close confirmation dialog
    } catch (error) {
      console.error('Failed to delete response:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const allSelected = responses.length > 0 && responses.every(r => selectedResponses.has(r.id));

  if (responsesLoading && responses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#913177]"></div>
        <div className="ml-4 text-lg text-[#1d0917]">Loading responses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResponsesToolbar />

      {responsesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">Error: {responsesError}</p>
          </CardContent>
        </Card>
      )}

      {/* Results summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {responses.length} of {responsesTotalCount} responses
        </span>
        {selectedResponses.size > 0 && (
          <span className="text-[#913177] font-medium">
            {selectedResponses.size} selected
          </span>
        )}
      </div>

      {/* Responses table */}
      <Card className="border-none shadow-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#913177] to-[#b8439a] text-white">
                {superAdminEnabled && (
                  <th className="text-left py-4 px-4 font-bold text-sm uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllResponses();
                        } else {
                          clearResponseSelection();
                        }
                      }}
                      className="h-4 w-4 text-[#913177] border-white rounded focus:ring-[#913177]"
                    />
                  </th>
                )}
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
              {responses.map((response, index) => (
                <tr 
                  key={response.id} 
                  className={`border-b border-[#f0f0f0] hover:bg-gradient-to-r hover:from-[#fff4fc] hover:to-white transition-all duration-200 ${
                    response.status === 'partial' ? 'bg-yellow-50' : (index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white')
                  } ${selectedResponses.has(response.id) ? 'bg-[#913177]/5' : ''}`}
                >
                  {superAdminEnabled && (
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedResponses.has(response.id)}
                        onChange={() => toggleResponseSelection(response.id)}
                        className="h-4 w-4 text-[#913177] border-gray-300 rounded focus:ring-[#913177]"
                      />
                    </td>
                  )}
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
                    <StatusBadge status={response.status} />
                  </td>
                  <td className="py-4 px-6 text-[#3d3d3d] text-sm">
                    {formatDate(response.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResponseClick(response.id)}
                        size="sm"
                        variant="outline"
                        className="border-[#913177]/30 text-[#913177] hover:bg-[#913177]/10"
                      >
                        👁️ View
                      </Button>
                      {superAdminEnabled && (
                        <Button
                          onClick={() => setDeleteConfirmId(response.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {responses.length === 0 && !responsesLoading && (
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Responses Found</h3>
            <p className="text-gray-500">No quiz responses match your current filters.</p>
          </CardContent>
        </Card>
      )}

      <LoadMoreButton />

      {/* Bulk actions bar - only show in edit mode when items are selected */}
      {superAdminEnabled && selectedResponses.size > 0 && <BulkActionsBar superAdminEnabled={superAdminEnabled} />}

      {/* Response detail modal */}
      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onDelete={handleDeleteResponse}
          superAdminEnabled={superAdminEnabled}
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <AlertDialog open={true} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Response</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this response? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteResponse(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};