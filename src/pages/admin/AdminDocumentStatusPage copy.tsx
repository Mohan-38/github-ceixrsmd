import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Search, 
  Filter, 
  Calendar,
  User,
  Package,
  Send,
  Eye,
  Download
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useProjects } from '../../context/ProjectContext';
import { Order } from '../../types';

interface DocumentStatus {
  orderId: string;
  customerName: string;
  customerEmail: string;
  projectTitle: string;
  orderDate: string;
  status: 'delivered' | 'pending' | 'no-documents' | 'partial';
  documentsCount: number;
  reviewStages: {
    review_1: number;
    review_2: number;
    review_3: number;
  };
  lastDeliveryDate?: string;
}

const AdminDocumentStatusPage = () => {
  const { orders, getProjectDocuments, projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Calculate document status for each order
  const documentStatuses = useMemo(() => {
    return orders.map((order): DocumentStatus => {
      const documents = getProjectDocuments(order.projectId);
      const totalDocuments = documents.length;
      
      // Count documents by review stage
      const reviewStages = {
        review_1: documents.filter(doc => doc.review_stage === 'review_1').length,
        review_2: documents.filter(doc => doc.review_stage === 'review_2').length,
        review_3: documents.filter(doc => doc.review_stage === 'review_3').length
      };

      // Determine status
      let status: DocumentStatus['status'];
      if (totalDocuments === 0) {
        status = 'no-documents';
      } else if (order.status === 'completed' && totalDocuments > 0) {
        status = 'delivered';
      } else if (totalDocuments > 0 && order.status === 'pending') {
        status = 'pending';
      } else {
        status = 'partial';
      }

      return {
        orderId: order.id,
        customerName: order.customer_name || order.customerName,
        customerEmail: order.customer_email || order.customerEmail,
        projectTitle: order.project_title || order.projectTitle,
        orderDate: order.created_at || order.createdAt || '',
        status,
        documentsCount: totalDocuments,
        reviewStages,
        lastDeliveryDate: status === 'delivered' ? order.updated_at || order.updatedAt : undefined
      };
    });
  }, [orders, getProjectDocuments]);

  // Filter document statuses
  const filteredStatuses = documentStatuses.filter(status => {
    const matchesSearch = 
      status.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? status.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'delivered':
        return {
          bg: 'bg-green-100 dark:bg-green-900',
          text: 'text-green-800 dark:text-green-300',
          icon: CheckCircle,
          label: 'Delivered'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: Clock,
          label: 'Pending Delivery'
        };
      case 'no-documents':
        return {
          bg: 'bg-red-100 dark:bg-red-900',
          text: 'text-red-800 dark:text-red-300',
          icon: AlertTriangle,
          label: 'No Documents'
        };
      case 'partial':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900',
          text: 'text-blue-800 dark:text-blue-300',
          icon: Upload,
          label: 'Partial'
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-700',
          text: 'text-slate-800 dark:text-slate-300',
          icon: FileText,
          label: 'Unknown'
        };
    }
  };

  // Calculate statistics
  const stats = {
    total: documentStatuses.length,
    delivered: documentStatuses.filter(s => s.status === 'delivered').length,
    pending: documentStatuses.filter(s => s.status === 'pending').length,
    noDocuments: documentStatuses.filter(s => s.status === 'no-documents').length,
    partial: documentStatuses.filter(s => s.status === 'partial').length
  };

  const statusOptions = [
    { value: 'delivered', label: 'Delivered' },
    { value: 'pending', label: 'Pending Delivery' },
    { value: 'no-documents', label: 'No Documents' },
    { value: 'partial', label: 'Partial' }
  ];

  const openDetailsModal = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailsModal(true);
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Document Delivery Status</h1>
            <p className="text-slate-500 dark:text-slate-400">Track document delivery status for all orders.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Delivered</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">No Documents</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.noDocuments}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Partial</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.partial}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by customer, email, project, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex space-x-2">
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'All'}
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <button 
                    onClick={() => setStatusFilter(null)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    All
                  </button>

                  {statusOptions.map(option => (
                    <button 
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Status Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8">
          {filteredStatuses.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">No orders found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {documentStatuses.length === 0 
                  ? "No orders have been placed yet." 
                  : "No orders match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Documents
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredStatuses.map((status) => {
                    const statusBadge = getStatusBadge(status.status);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <tr key={status.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-8 w-8 text-slate-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {status.projectTitle}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {status.orderId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-6 w-6 text-slate-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {status.customerName}
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                <a href={`mailto:${status.customerEmail}`} className="hover:underline">
                                  {status.customerEmail}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-900 dark:text-slate-200">
                                {status.documentsCount}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <div>R1: {status.reviewStages.review_1}</div>
                              <div>R2: {status.reviewStages.review_2}</div>
                              <div>R3: {status.reviewStages.review_3}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusBadge.label}
                          </span>
                          {status.lastDeliveryDate && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Delivered: {formatDate(status.lastDeliveryDate)}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(status.orderDate)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailsModal(status.orderId)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {status.status === 'no-documents' && (
                              <button
                                onClick={() => {
                                  // Navigate to project documents management
                                  window.location.href = `/admin/projects`;
                                }}
                                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors"
                                title="Upload documents"
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            )}
                            
                            {(status.status === 'pending' || status.status === 'partial') && status.documentsCount > 0 && (
                              <button
                                onClick={() => {
                                  // Navigate to document delivery page
                                  window.location.href = `/admin/document-delivery`;
                                }}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                                title="Send documents"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Order Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Order Information */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Order Information</h4>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
                    <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                    <p><strong>Project:</strong> {selectedOrder.project_title || selectedOrder.projectTitle}</p>
                    <p><strong>Customer:</strong> {selectedOrder.customer_name || selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.customerEmail}</p>
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.created_at || selectedOrder.createdAt || '')}</p>
                  </div>
                </div>

                {/* Document Status */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Document Status</h4>
                  <div className="space-y-3">
                    {['review_1', 'review_2', 'review_3'].map((stage) => {
                      const documents = getProjectDocuments(selectedOrder.projectId).filter(
                        doc => doc.review_stage === stage && doc.is_active
                      );
                      const stageLabel = stage.replace('_', ' ').toUpperCase();
                      
                      return (
                        <div key={stage} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-slate-900 dark:text-slate-200">
                              {stageLabel}
                            </h5>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                              {documents.length} docs
                            </span>
                          </div>
                          
                          {documents.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded</p>
                          ) : (
                            <div className="space-y-1">
                              {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-700 dark:text-slate-300">{doc.name}</span>
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Recommendations */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Recommended Actions</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    {(() => {
                      const totalDocs = getProjectDocuments(selectedOrder.projectId).length;
                      if (totalDocs === 0) {
                        return (
                          <div className="flex items-start">
                            <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-800 dark:text-orange-300">Upload Documents</p>
                              <p className="text-sm text-orange-700 dark:text-orange-400">
                                No documents have been uploaded for this project. Go to Projects management to add documents.
                              </p>
                            </div>
                          </div>
                        );
                      } else if (selectedOrder.status === 'pending') {
                        return (
                          <div className="flex items-start">
                            <Send className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300">Send Documents</p>
                              <p className="text-sm text-green-700 dark:text-green-400">
                                Documents are ready to be delivered. Go to Document Delivery to send them to the customer.
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300">Documents Delivered</p>
                              <p className="text-sm text-green-700 dark:text-green-400">
                                All documents have been successfully delivered to the customer.
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocumentStatusPage;