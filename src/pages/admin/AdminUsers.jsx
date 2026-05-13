import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { Search, Plus, Edit2, Trash2, Shield, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConfirmationModal } from '../../components/ConfirmationModal';




const AdminUsers = () => {
  const { users, drivers, addUser, updateUser, deleteUser, toggleUserStatus, showToast } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CLIENT');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };


  const allSystemUsers = Array.from(new Map([...users, ...drivers].map(u => [u.id, u])).values());

  const filteredUsers = allSystemUsers.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    const formData = new FormData(e.currentTarget);
    const errors = {};

    // Base validation
    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const role = formData.get('role');

    if (!name) errors.name = 'Full name is required';
    if (!email) errors.email = 'Email address is required';
    if (!phone) errors.phone = 'Phone number is required';
    
    if (!editingUser) {
      const password = (formData.get('password') || '').toString().trim();
      if (!password) errors.password = 'Password is required';
    }

    // Role-specific validation
    if (role === 'DRIVER') {
      const vehicleNumber = (formData.get('vehicleNumber') || '').toString().trim();
      const vehicleType = formData.get('vehicleType');
      if (!vehicleNumber) errors.vehicleNumber = 'Vehicle plate is required';
      if (!vehicleType || vehicleType === 'none') errors.vehicleType = 'Vehicle type is required';
    } else if (role === 'CLIENT') {
      const companyName = (formData.get('companyName') || '').toString().trim();
      const billingEmail = (formData.get('billingEmail') || '').toString().trim();
      const companyPhone = (formData.get('companyPhone') || '').toString().trim();
      const street = (formData.get('street') || '').toString().trim();
      const city = (formData.get('city') || '').toString().trim();
      const state = (formData.get('state') || '').toString().trim();
      const zip = (formData.get('zip') || '').toString().trim();

      if (!companyName) errors.companyName = 'Company name is required';
      if (!billingEmail) errors.billingEmail = 'Billing email is required';
      if (!companyPhone) errors.companyPhone = 'Business phone is required';
      if (!street) errors.street = 'Street address is required';
      if (!city) errors.city = 'City is required';
      if (!state) errors.state = 'State is required';
      if (!zip) errors.zip = 'ZIP code is required';
    }


    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setSubmitting(true);
    const userData = {
      name,
      email,
      password: formData.get('password') || undefined,
      role,
      phone,
      vehicleNumber: role === 'DRIVER' ? formData.get('vehicleNumber') : undefined,
      vehicleType: role === 'DRIVER' ? formData.get('vehicleType') : undefined,
      active: editingUser ? editingUser.active : true,
      companyDetails: role === 'CLIENT' ? {
        companyName: formData.get('companyName'),
        billingEmail: formData.get('billingEmail'),
        phone: formData.get('companyPhone'),
        feeType: formData.get('feeType'),
        feeValue: Number(formData.get('feeValue')) || 0,
        address: {
          street: formData.get('street'),
          city: formData.get('city'),
          state: formData.get('state'),
          zip: formData.get('zip'),
        }
      } : undefined
    };

    try {
      if (editingUser) {
        await updateUser(editingUser.id, userData);
        showToast('User updated successfully');
      } else {
        await addUser(userData);
        showToast('User registered successfully');
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      showToast(err.message || 'An error occurred while saving the user', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const openAddModal = () => {
    setEditingUser(null);
    setSelectedRole('CLIENT');
    setShowPassword(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setFieldErrors({});
    setIsModalOpen(true);
  };


  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage system administrators, clients, and drivers.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'ADMIN', 'CLIENT', 'DRIVER']).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  roleFilter === role
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                )}
              >
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email} {user.phone && `• ${user.phone}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'ADMIN' ? (
                        <Shield className="w-4 h-4 text-rose-500" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-700 capitalize">{user.role?.toLowerCase() || 'user'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        try {
                          await toggleUserStatus(user.id, !!user.active);
                          showToast(`User status updated to ${!user.active ? 'Active' : 'Inactive'}`);
                        } catch (err) {
                          showToast(err.message || 'Failed to update status', 'error');
                        }
                      }}
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                        user.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, user })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4 transition-transform hover:scale-110 duration-300">
                <UserIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No users found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 transform animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  name="name"
                  defaultValue={editingUser?.name || ''}
                  onChange={() => clearFieldError('name')}
                  className={cn(
                    "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    fieldErrors.name 
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  )}
                />
                {fieldErrors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email || ''}
                  onChange={() => clearFieldError('email')}
                  className={cn(
                    "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    fieldErrors.email 
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  )}
                />
                {fieldErrors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  defaultValue={editingUser?.phone || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = val;
                    clearFieldError('phone');
                  }}
                  className={cn(
                    "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    fieldErrors.phone 
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  )}
                />
                {fieldErrors.phone && <p className="text-rose-500 text-xs mt-1 font-medium">{fieldErrors.phone}</p>}
              </div>


              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      onChange={() => clearFieldError('password')}
                      className={cn(
                        "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-all pr-12",
                        fieldErrors.password 
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>

              {selectedRole === 'CLIENT' && (
                <div className="space-y-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 mb-3">Business Registry</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                      <input 
                        name="companyName" 
                        defaultValue={editingUser?.companyDetails?.companyName || ''} 
                        onChange={() => clearFieldError('companyName')}
                        className={cn(
                          "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-sm transition-all",
                          fieldErrors.companyName 
                            ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                            : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                        )}
                      />
                      {fieldErrors.companyName && <p className="text-rose-500 text-[10px] mt-1 font-medium">{fieldErrors.companyName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Email</label>
                      <input 
                        name="billingEmail" 
                        type="email" 
                        defaultValue={editingUser?.companyDetails?.billingEmail || ''} 
                        onChange={() => clearFieldError('billingEmail')}
                        className={cn(
                          "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-sm transition-all",
                          fieldErrors.billingEmail 
                            ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                            : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                        )}
                      />
                      {fieldErrors.billingEmail && <p className="text-rose-500 text-[10px] mt-1 font-medium">{fieldErrors.billingEmail}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Business Phone</label>
                      <input 
                        name="companyPhone" 
                        type="tel"
                        inputMode="numeric"
                        defaultValue={editingUser?.companyDetails?.phone || editingUser?.phone || ''} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = val;
                          clearFieldError('companyPhone');
                        }}
                        className={cn(
                          "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-sm transition-all",
                          fieldErrors.companyPhone 
                            ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                            : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                        )}
                      />
                      {fieldErrors.companyPhone && <p className="text-rose-500 text-[10px] mt-1 font-medium">{fieldErrors.companyPhone}</p>}
                    </div>


                  </div>



                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Model</label>
                      <select 
                        name="feeType" 
                        defaultValue={editingUser?.companyDetails?.feeType || 'FIXED'} 
                        className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm"
                      >
                        <option value="FIXED">Fixed per Delivery</option>
                        <option value="PERCENTAGE">Percentage of Value</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Value</label>
                      <input 
                        name="feeValue" 
                        type="number" 
                        defaultValue={editingUser?.companyDetails?.feeValue || 15} 
                        className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm" 
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Office Address</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input 
                          name="street" 
                          defaultValue={editingUser?.companyDetails?.address?.street || ''} 
                          placeholder="Street Address" 
                          onChange={() => clearFieldError('street')}
                          className={cn(
                            "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-xs transition-all",
                            fieldErrors.street 
                              ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                              : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                          )}
                        />
                        {fieldErrors.street && <p className="text-rose-500 text-[10px] mt-0.5 font-medium">{fieldErrors.street}</p>}
                      </div>
                      <div>
                        <input 
                          name="city" 
                          defaultValue={editingUser?.companyDetails?.address?.city || ''} 
                          placeholder="City" 
                          onChange={() => clearFieldError('city')}
                          className={cn(
                            "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-xs transition-all",
                            fieldErrors.city 
                              ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                              : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                          )}
                        />
                        {fieldErrors.city && <p className="text-rose-500 text-[10px] mt-0.5 font-medium">{fieldErrors.city}</p>}
                      </div>
                      <div>
                        <input 
                          name="state" 
                          defaultValue={editingUser?.companyDetails?.address?.state || ''} 
                          placeholder="State" 
                          onChange={() => clearFieldError('state')}
                          className={cn(
                            "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-xs transition-all",
                            fieldErrors.state 
                              ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                              : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                          )}
                        />
                        {fieldErrors.state && <p className="text-rose-500 text-[10px] mt-0.5 font-medium">{fieldErrors.state}</p>}
                      </div>
                      <div className="col-span-2">
                        <input 
                          name="zip" 
                          defaultValue={editingUser?.companyDetails?.address?.zip || ''} 
                          placeholder="ZIP Code" 
                          onChange={() => clearFieldError('zip')}
                          className={cn(
                            "w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-xs transition-all",
                            fieldErrors.zip 
                              ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                              : "border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                          )}
                        />
                        {fieldErrors.zip && <p className="text-rose-500 text-[10px] mt-0.5 font-medium">{fieldErrors.zip}</p>}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {selectedRole === 'DRIVER' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Vehicle Plate</label>
                    <input
                      name="vehicleNumber"
                      type="text"
                      placeholder="ABC-123"
                      defaultValue={editingUser?.vehicleNumber || ''}
                      onChange={() => clearFieldError('vehicleNumber')}
                      className={cn(
                        "w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 transition-all",
                        fieldErrors.vehicleNumber 
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                          : "border-indigo-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      )}
                    />
                    {fieldErrors.vehicleNumber && <p className="text-rose-500 text-[10px] mt-1 font-medium">{fieldErrors.vehicleNumber}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Vehicle Type</label>
                    <select
                      name="vehicleType"
                      defaultValue={editingUser?.vehicleType || 'Van'}
                      onChange={() => clearFieldError('vehicleType')}
                      className={cn(
                        "w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 transition-all",
                        fieldErrors.vehicleType 
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" 
                          : "border-indigo-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      )}
                    >
                      <option value="none">Select Type</option>
                      <option value="Bike">Bike</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                    </select>
                    {fieldErrors.vehicleType && <p className="text-rose-500 text-[10px] mt-1 font-medium">{fieldErrors.vehicleType}</p>}
                  </div>

                </div>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {submitting ? 'Processing...' : (editingUser ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
        onConfirm={async () => {
          const user = deleteConfirm.user;
          if (!user) return;
          try {
            await deleteUser(user.id);
            showToast(`User "${user.name}" deleted successfully`);
          } catch (err) {
            showToast(err.message || 'Failed to delete user', 'error');
          }
        }}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteConfirm.user?.name}"? This action cannot be undone.`}
        confirmText="Permanently Delete"
      />
    </MainLayout>
  );
};

export default AdminUsers;
