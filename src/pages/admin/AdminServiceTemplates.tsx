import React, { useState, useEffect } from 'react';
import { getServices, getServiceTemplates, addServiceTemplate, updateServiceTemplate, deleteServiceTemplate } from '../../services/db';
import { Service, ServiceTemplate } from '../../types';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminServiceTemplates() {
  const [services, setServices] = useState<Service[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchTemplates(selectedServiceId);
    } else {
      setTemplates([]);
    }
  }, [selectedServiceId]);

  async function fetchServices() {
    setLoading(true);
    const data = await getServices(false);
    setServices(data);
    if (data.length > 0) {
      setSelectedServiceId(data[0].id);
    }
    setLoading(false);
  }

  async function fetchTemplates(serviceId: string) {
    setLoadingTemplates(true);
    try {
      const data = await getServiceTemplates(serviceId, false);
      console.log('Fetched templates:', data);
      setTemplates(data as ServiceTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setLoadingTemplates(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    
    try {
      if (isEditing && editingId) {
        await updateServiceTemplate(editingId, formData);
        toast.success("Design updated!");
      } else {
        await addServiceTemplate({
          ...formData,
          serviceId: selectedServiceId
        });
        toast.success("Design added!");
      }
      
      resetForm();
      fetchTemplates(selectedServiceId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save design");
    }
  };

  const handleEdit = (template: ServiceTemplate) => {
    setIsEditing(true);
    setEditingId(template.id);
    setFormData({
      name: template.name,
      imageUrl: template.imageUrl || '',
      price: template.price || 0,
      isActive: template.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteServiceTemplate(id);
        fetchTemplates(selectedServiceId);
        toast.success("Design deleted");
      } catch (error) {
        toast.error("Failed to delete design");
      }
    }
  };

  const handleToggleStatus = async (template: ServiceTemplate) => {
    try {
      await updateServiceTemplate(template.id, { isActive: !template.isActive });
      fetchTemplates(selectedServiceId);
      toast.success(`Design ${!template.isActive ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      imageUrl: '',
      price: 0,
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Banner Designs</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 font-sans">
        <h2 className="text-lg sm:text-xl font-bold mb-6 uppercase">{isEditing ? 'Edit Banner Design' : 'Add New Banner Design'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              >
                <option value="" disabled>Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
                placeholder="e.g. Minimal Stream Layout"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
                min="0"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="https://example.com/image.png"
                required
              />
              {formData.imageUrl && (
                <div className="mt-4 aspect-video w-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                  }} />
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-bold text-gray-700">Template is active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!selectedServiceId}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isEditing ? 'Update Banner Design' : 'Add Banner Design'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loadingTemplates ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className={`border rounded-2xl overflow-hidden ${template.isActive ? 'border-gray-200' : 'border-red-200 opacity-75'}`}>
                <div className="aspect-video w-full relative">
                  {template.imageUrl ? (
                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {!template.isActive && (
                    <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Inactive</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{template.name}</h3>
                  <p className="font-black text-blue-600 mb-4">LKR {(template.price || 0).toLocaleString()}</p>
                  
                  <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                    <button
                      onClick={() => handleToggleStatus(template)}
                      className={`flex items-center font-bold text-sm ${template.isActive ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                    >
                      {template.isActive ? (
                        <><EyeOff className="w-4 h-4 mr-1" /> Disable</>
                      ) : (
                        <><Eye className="w-4 h-4 mr-1" /> Enable</>
                      )}
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No templates found for this service.</p>
                <p className="text-sm">Create one above to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
