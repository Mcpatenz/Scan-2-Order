import React, { useState, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Employee } from '../../types';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Shield,
  CreditCard,
  Utensils,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

export const EmployeeManager: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, showToast } = useOrderContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'cashier' | 'kitchen'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'cashier' | 'kitchen'>('cashier');
  const [employeeCode, setEmployeeCode] = useState('');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  // Photo Upload & Camera State
  const [photoOption, setPhotoOption] = useState<'url' | 'upload' | 'camera'>('url');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.contactNumber.includes(searchQuery);

    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;

    return matchesSearch;
  });

  // Open modal for new employee
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('Male');
    setStatus('Active');
    setBirthDate('1995-01-01');
    setAddress('');
    setContactNumber('');
    setEmail('');
    setPassword('empPass123');
    setShowPassword(false);
    setRole('cashier');
    setEmployeeCode(`EMP-${100 + employees.length + 1}`);
    setPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
    setPhotoOption('url');
    stopCamera();
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setMiddleName(emp.middleName || '');
    setLastName(emp.lastName);
    setGender(emp.gender as 'Male' | 'Female' | 'Other');
    setStatus(emp.status);
    setBirthDate(emp.birthDate || '1995-01-01');
    setAddress(emp.address || '');
    setContactNumber(emp.contactNumber || '');
    setEmail(emp.email);
    setPassword(emp.password);
    setShowPassword(false);
    setRole(emp.role);
    setEmployeeCode(emp.employeeCode);
    setPhoto(emp.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
    setPhotoOption('url');
    stopCamera();
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setModalOpen(false);
  };

  // Photo file upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhoto(reader.result);
          showToast('✓ Photo uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera failed:', err);
      showToast('⚠️ Unable to access camera. Please enter photo URL or upload file.');
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Capture snapshot from webcam
  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
        setPhotoOption('url');
        showToast('📸 Photo captured from camera!');
      }
    }
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      showToast('⚠️ Please fill in First Name, Last Name, Email, and Password.');
      return;
    }

    if (editingEmployee) {
      updateEmployee({
        ...editingEmployee,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        gender,
        status,
        birthDate,
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        password: password.trim(),
        photo,
        role,
        employeeCode: employeeCode.trim() || editingEmployee.employeeCode,
      });
    } else {
      addEmployee({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        gender,
        status,
        birthDate,
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        password: password.trim(),
        photo,
        role,
        employeeCode: employeeCode.trim() || `EMP-${Date.now().toString().slice(-3)}`,
        pinCode: '1234',
        scheduledShift: '08:00 AM - 05:00 PM',
      });
    }

    handleCloseModal();
  };

  const getRoleBadge = (r: Employee['role']) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 rounded-lg">
            <Shield className="h-3 w-3 text-indigo-400" /> ADMIN
          </span>
        );
      case 'cashier':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-300 bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 rounded-lg">
            <CreditCard className="h-3 w-3 text-sky-400" /> CASHIER
          </span>
        );
      case 'kitchen':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
            <Utensils className="h-3 w-3 text-amber-400" /> KITCHEN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Employee Directory & Access Control</h2>
            <p className="text-xs text-slate-400">
              Manage employee profiles, credentials, photo ID, and system role access
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add New Employee
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, email, code, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All System Roles (Admin, Cashier, Kitchen)</option>
            <option value="admin">Admin Only</option>
            <option value="cashier">Cashier POS Only</option>
            <option value="kitchen">Kitchen Staff Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Employment Statuses</option>
            <option value="Active">Active Status</option>
            <option value="Inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-slate-950/80 p-12 text-center rounded-3xl border border-slate-800 text-slate-400 space-y-2">
            <Users className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No employees found matching your criteria.</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-400 font-extrabold underline"
            >
              Add a new employee
            </button>
          </div>
        ) : (
          filteredEmployees.map(emp => {
            const fullName = `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`;

            return (
              <div
                key={emp.id}
                className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                {/* Card Top Row: Photo + Main Info */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={emp.photo}
                      alt={fullName}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-900"
                      onError={e => {
                        (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
                      }}
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 ${
                        emp.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                      title={emp.status}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        {emp.employeeCode}
                      </span>
                      {getRoleBadge(emp.role)}
                    </div>

                    <h3 className="text-base font-black text-white truncate leading-tight" title={fullName}>
                      {fullName}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{emp.gender}</span>
                      <span>•</span>
                      <span className={emp.status === 'Active' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-900 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400 truncate">
                    <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate" title={emp.email}>{emp.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{emp.contactNumber || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span>Born: {emp.birthDate || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 truncate">
                    <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="truncate" title={emp.address}>{emp.address || 'No address logged'}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                  <div className="text-[10px] text-slate-500 font-mono">
                    Pass: ••••••••
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="p-2 rounded-xl bg-slate-900 text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                      title="Edit Employee"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete employee ${fullName}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-900 text-rose-400 hover:bg-rose-600 hover:text-white transition"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl my-8 bg-slate-950 rounded-3xl border border-slate-800 p-6 text-white shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white font-black">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingEmployee ? `Edit Employee Record: ${editingEmployee.firstName}` : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-slate-400">Fill in employee details, credentials, and role permission</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                  Employee Photo ID
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={photo}
                    alt="Preview"
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md bg-slate-950"
                  />
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoOption('url');
                          stopCamera();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition ${
                          photoOption === 'url' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoOption('upload');
                          stopCamera();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition ${
                          photoOption === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoOption('camera');
                          startCamera();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition ${
                          photoOption === 'camera' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Webcam
                      </button>
                    </div>

                    {photoOption === 'url' && (
                      <input
                        type="text"
                        value={photo}
                        onChange={e => setPhoto(e.target.value)}
                        placeholder="Enter image URL..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {photoOption === 'upload' && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {photoOption === 'camera' && (
                      <div className="space-y-2">
                        {cameraActive ? (
                          <div className="space-y-2">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="h-32 w-full object-cover rounded-xl border border-slate-700 bg-black"
                            />
                            <button
                              type="button"
                              onClick={captureSnapshot}
                              className="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-xl"
                            >
                              <Camera className="h-4 w-4" /> Take Photo Snapshot
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl"
                          >
                            Start Camera
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Names Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    placeholder="e.g. James"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Mercer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Gender, Status, Role, Code */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="admin">Admin Dashboard</option>
                    <option value="cashier">Cashier POS</option>
                    <option value="kitchen">Kitchen Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    placeholder="EMP-104"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Birth Date, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="employee@restaurant.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password field with toggle visibility button */}
              <div>
                <label className="block text-slate-400 font-extrabold mb-1">System Login Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set account password..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-400 font-extrabold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address, City, Country"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-extrabold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
