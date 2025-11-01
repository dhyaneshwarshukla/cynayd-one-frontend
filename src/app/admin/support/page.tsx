"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { apiClient } from '@/lib/api-client';
import { 
  LifebuoyIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  createdAt: string;
  updatedAt: string;
  responses?: SupportResponse[];
}

interface SupportResponse {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs' | 'analytics'>('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general'>('all');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [newTicket, setNewTicket] = useState({
    userId: '',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general' as 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general',
  });

  useEffect(() => {
    document.title = 'Support Management | CYNAYD One';
    if (!authLoading && user) {
      fetchData();
      fetchUsers();
    }
  }, [authLoading, user, filterStatus, filterPriority, filterCategory]);

  const fetchUsers = async () => {
    try {
      const usersData = await apiClient.getUsers();
      setUsers(usersData.map(u => ({ id: u.id, name: u.name, email: u.email })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets from API
      const ticketsData = await apiClient.getSupportTickets({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
      });
      
      // Transform API data to match frontend format
      const transformedTickets: SupportTicket[] = ticketsData.map((ticket: any) => ({
        id: ticket.id,
        userId: ticket.userId,
        userEmail: ticket.user?.email || '',
        userName: ticket.user?.name || ticket.user?.email?.split('@')[0] || 'Unknown',
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        responses: ticket.responses?.map((r: any) => ({
          id: r.id,
          ticketId: r.ticketId,
          userId: r.userId,
          message: r.message,
          isAdmin: r.isAdmin,
          createdAt: r.createdAt,
        })) || [],
      }));
      
      setTickets(transformedTickets);
      
      // Keep FAQs mock data for now
      setFaqs([
        {
          id: '1',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. You will receive an email with instructions to reset your password.',
          category: 'general',
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          question: 'How do I add users to my organization?',
          answer: 'Organization admins can add users by going to the Users section and clicking "Add User". You will need to provide the user\'s email address and assign them a role.',
          category: 'general',
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are securely processed through our payment gateway.',
          category: 'billing',
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching support data:', error);
      alert('Failed to load support tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await apiClient.updateSupportTicket(ticketId, { status: newStatus });
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status. Please try again.');
    }
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;
    
    try {
      const response = await apiClient.createSupportResponse(selectedTicket.id, responseMessage);
      
      const newResponse: SupportResponse = {
        id: response.id,
        ticketId: response.ticketId,
        userId: response.userId,
        message: response.message,
        isAdmin: response.isAdmin,
        createdAt: response.createdAt,
      };
      
      // Update ticket with new response and status
      const updatedTicket = { 
        ...selectedTicket, 
        responses: [...(selectedTicket.responses || []), newResponse],
        status: 'in-progress' as const 
      };
      
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      ));
      
      setResponseMessage('');
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Failed to send response. Please try again.');
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.userId || !newTicket.subject || !newTicket.message) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedUser = users.find(u => u.id === newTicket.userId);
    if (!selectedUser) {
      alert('Please select a valid user');
      return;
    }

    try {
      const createdTicket = await apiClient.createSupportTicket({
        userId: newTicket.userId,
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority,
        category: newTicket.category,
      });

      // Transform API response to match frontend format
      const ticket: SupportTicket = {
        id: createdTicket.id,
        userId: createdTicket.userId,
        userEmail: createdTicket.user?.email || selectedUser.email,
        userName: createdTicket.user?.name || selectedUser.name || selectedUser.email.split('@')[0],
        subject: createdTicket.subject,
        message: createdTicket.message,
        status: createdTicket.status,
        priority: createdTicket.priority,
        category: createdTicket.category,
        createdAt: createdTicket.createdAt,
        updatedAt: createdTicket.updatedAt,
        responses: createdTicket.responses || [],
      };

      setTickets([ticket, ...tickets]);
      setShowCreateTicketModal(false);
      setNewTicket({
        userId: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    avgResponseTime: '4.2 hours',
    totalFAQs: faqs.length,
  };

  if (authLoading || loading) {
    return (
      <UnifiedLayout title="Support Management" subtitle="Manage support tickets and FAQs" variant="dashboard">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout 
      title="Support Management" 
      subtitle="Manage support tickets, FAQs, and customer inquiries"
      variant="dashboard"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.openTickets}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressTickets}</p>
              </div>
              <LifebuoyIcon className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Support Tickets
                {stats.openTickets > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    {stats.openTickets}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'faqs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
                FAQs
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Analytics
              </div>
            </button>
          </nav>
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Create Ticket Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
              <Button
                onClick={() => {
                  setNewTicket({
                    userId: '',
                    subject: '',
                    message: '',
                    priority: 'medium',
                    category: 'general',
                  });
                  setShowCreateTicketModal(true);
                }}
                className="flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New Ticket
              </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="general">General</option>
                </select>
              </div>
            </Card>

            {/* Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <Card className="p-8 text-center">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tickets found</p>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowTicketModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {ticket.userName} ({ticket.userEmail})
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {faqs.map((faq) => (
                <Card key={faq.id} className="p-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                      {faq.isPublished ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">{faq.category}</span>
                      <span>Updated {new Date(faq.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tickets</span>
                    <span className="font-semibold">{stats.totalTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Tickets</span>
                    <span className="font-semibold text-yellow-600">{stats.openTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress</span>
                    <span className="font-semibold text-blue-600">{stats.inProgressTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved</span>
                    <span className="font-semibold text-green-600">{stats.resolvedTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Response Time</span>
                    <span className="font-semibold">{stats.avgResponseTime}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
                <div className="space-y-2">
                  {['technical', 'billing', 'feature-request', 'bug-report', 'general'].map((category) => {
                    const count = tickets.filter(t => t.category === category).length;
                    const percentage = stats.totalTickets > 0 ? (count / stats.totalTickets) * 100 : 0;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{category.replace('-', ' ')}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                <button
                  onClick={() => {
                    setShowTicketModal(false);
                    setSelectedTicket(null);
                    setResponseMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {selectedTicket.category}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{selectedTicket.userName}</span>
                    <span className="text-gray-500">({selectedTicket.userEmail})</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Created {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Responses */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Responses</h3>
                    <div className="space-y-4">
                      {selectedTicket.responses.map((response) => (
                        <div key={response.id} className={`p-3 rounded-lg ${response.isAdmin ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {response.isAdmin ? 'Admin' : 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(response.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Form */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Add Response</h3>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as SupportTicket['status'])}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <Button onClick={handleSendResponse} disabled={!responseMessage.trim()}>
                      Send Response
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Support Ticket</h2>
                <button
                  onClick={() => {
                    setShowCreateTicketModal(false);
                    setNewTicket({
                      userId: '',
                      subject: '',
                      message: '',
                      priority: 'medium',
                      category: 'general',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newTicket.userId}
                    onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Enter ticket subject..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    placeholder="Enter ticket message/description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="bug-report">Bug Report</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateTicketModal(false);
                      setNewTicket({
                        userId: '',
                        subject: '',
                        message: '',
                        priority: 'medium',
                        category: 'general',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket}>
                    Create Ticket
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

    </UnifiedLayout>
  );
}

