import React, { useState, useRef, useEffect } from 'react';
import { 
  Search,
  Plus,
  Users, 
  Calendar,
  MoreVertical,
  Star,
  Folder,
  Settings,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

interface Project {
  id: string;
  name: string;
  teamName: string;
  description: string;
  color: string;
  tasks: Task[];
  members: number;
  progress: number;
  starred: boolean;
}

interface Member {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
}

interface MemberListResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProjectsPageProps {
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ onLogout, onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Website Redesign',
      teamName: 'Design Team',
      description: 'Complete redesign of company website',
      color: 'from-blue-400 to-blue-600',
      tasks: [
        { id: 't1', title: 'Create wireframes', status: 'done', dueDate: '2024-01-15' },
        { id: 't2', title: 'Design mockups', status: 'in-progress', dueDate: '2024-01-20' },
        { id: 't3', title: 'Frontend development', status: 'todo', dueDate: '2024-02-01' },
      ],
      members: 5,
      progress: 60,
      starred: true,
    },
    {
      id: '2',
      name: 'Mobile App Development',
      teamName: 'Engineering Team',
      description: 'Build iOS and Android mobile application',
      color: 'from-purple-400 to-purple-600',
      tasks: [
        { id: 't4', title: 'API integration', status: 'in-progress', dueDate: '2024-01-18' },
        { id: 't5', title: 'UI implementation', status: 'in-progress', dueDate: '2024-01-25' },
        { id: 't6', title: 'Testing', status: 'todo', dueDate: '2024-02-05' },
      ],
      members: 8,
      progress: 45,
      starred: false,
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      teamName: 'Marketing Team',
      description: 'Q1 2024 marketing campaign',
      color: 'from-green-400 to-green-600',
      tasks: [
        { id: 't7', title: 'Content creation', status: 'done', dueDate: '2024-01-10' },
        { id: 't8', title: 'Social media posts', status: 'in-progress', dueDate: '2024-01-22' },
        { id: 't9', title: 'Email campaign', status: 'todo', dueDate: '2024-01-30' },
      ],
      members: 4,
      progress: 70,
      starred: true,
    },
    {
      id: '4',
      name: 'Database Migration',
      teamName: 'DevOps Team',
      description: 'Migrate database to new infrastructure',
      color: 'from-red-400 to-red-600',
      tasks: [
        { id: 't10', title: 'Backup current data', status: 'done', dueDate: '2024-01-12' },
        { id: 't11', title: 'Setup new database', status: 'in-progress', dueDate: '2024-01-19' },
        { id: 't12', title: 'Data migration', status: 'todo', dueDate: '2024-01-26' },
      ],
      members: 3,
      progress: 35,
      starred: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Member modal state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Member list state
  const [members, setMembers] = useState<Member[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  
  const memberLimit = 10;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search - chờ 500ms sau khi user ngừng gõ
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setMemberSearch(memberSearchInput);
      setMemberPage(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [memberSearchInput]);

  // Fetch members khi modal mở hoặc page/search thay đổi
  useEffect(() => {
    if (memberModalOpen && selectedProject) {
      fetchMembers();
    }
  }, [memberModalOpen, selectedProject, memberPage, memberSearch]);

  const fetchMembers = async () => {
    if (!selectedProject) return;

    setMemberLoading(true);
    setMemberError(null);

    try {
      const params = new URLSearchParams({
        page: memberPage.toString(),
        limit: memberLimit.toString(),
      });

      if (memberSearch) {
        params.append('search', memberSearch);
      }

      const response = await fetch(
        `http://localhost:3000/projects/:projectId/members?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data: MemberListResponse = await response.json();
      
      setMembers(data.members || []);
      setMemberTotal(data.total || 0);
      setMemberTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMemberError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setMemberLoading(false);
    }
  };

  const toggleStar = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, starred: !p.starred } : p
    ));
  };

  const toggleDropdown = (projectId: string) => {
    setOpenDropdownId(openDropdownId === projectId ? null : projectId);
  };

  const handleViewMembers = (project: Project) => {
    setSelectedProject(project);
    setMemberModalOpen(true);
    setOpenDropdownId(null);
    
    // Reset state
    setMemberPage(1);
    setMemberSearch('');
    setMemberSearchInput('');
    setMembers([]);
  };

  const handleCloseMemberModal = () => {
    setMemberModalOpen(false);
    setSelectedProject(null);
    setMembers([]);
    setMemberSearch('');
    setMemberSearchInput('');
    setMemberPage(1);
  };

  const handleEditProject = (projectId: string) => {
    console.log('Edit project:', projectId);
    setOpenDropdownId(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId));
      setOpenDropdownId(null);
    }
  };

  const handleMemberPrevPage = () => {
    if (memberPage > 1) {
      setMemberPage(memberPage - 1);
    }
  };

  const handleMemberNextPage = () => {
    if (memberPage < memberTotalPages) {
      setMemberPage(memberPage + 1);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === 'all' || project.teamName === filterTeam;
    return matchesSearch && matchesTeam;
  });

  const teams = ['all', ...Array.from(new Set(projects.map(p => p.teamName)))];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-20 bg-purple-500 flex flex-col items-center py-4 space-y-6">
        <div className="text-white font-bold text-xl">Jira</div>
        
        <div className="flex flex-col space-y-4 mt-8">
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Users size={20} />
          </button>
          
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded"
          >
            <Folder size={20} />
            <span className="text-xs mt-1">Boards</span>
          </button>

          <button 
            className="flex flex-col items-center text-white bg-purple-600 p-2 rounded"
          >
            <Folder size={20} />
            <span className="text-xs mt-1">Projects</span>
          </button>

          <button 
            onClick={() => onNavigate?.('members')}
            className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded"
          >
            <Users size={20} />
            <span className="text-xs mt-1">Members</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-purple-400 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Workspace</span>
              <span className="text-gray-800">v</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Recent</span>
              <span className="text-gray-800">v</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Starred</span>
              <span className="text-gray-800">v</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Templates</span>
              <span className="text-gray-800">v</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search"
              className="bg-purple-300 text-gray-800 placeholder-gray-600 px-4 py-1.5 rounded focus:outline-none focus:bg-purple-200"
            />
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-1.5 rounded font-medium">
              Create
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded font-medium flex items-center space-x-1">
              <span>⚡</span>
              <span>Try Premium</span>
            </button>
            <button 
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded font-medium"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Projects</h1>
            <p className="text-gray-600">Manage all your team projects in one place</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <select 
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {teams.map(team => (
                  <option key={team} value={team}>
                    {team === 'all' ? 'All Teams' : team}
                  </option>
                ))}
              </select>
            </div>

            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus size={20} />
              <span>New Project</span>
            </button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                {/* Project Header with Color */}
                <div className={`bg-gradient-to-r ${project.color} h-24 rounded-t-lg p-4 flex items-center justify-between`}>
                  <div>
                    <h3 className="text-white font-bold text-lg">{project.name}</h3>
                    <p className="text-white text-sm opacity-90">{project.teamName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStar(project.id)}
                      className="text-white hover:scale-110 transition-transform"
                    >
                      <Star size={20} fill={project.starred ? 'currentColor' : 'none'} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => toggleDropdown(project.id)}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openDropdownId === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleViewMembers(project)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              View Members
                            </span>
                          </button>
                          <button
                            onClick={() => handleEditProject(project.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Settings className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Settings
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              Delete Project
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Body */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${project.color} h-2 rounded-full transition-all`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tasks Summary */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tasks ({project.tasks.length})</h4>
                    <div className="space-y-1">
                      {project.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center text-sm">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            task.status === 'done' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-yellow-500' :
                            'bg-gray-300'
                          }`}></span>
                          <span className="text-gray-700 flex-1 truncate">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>{project.members} members</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Folder size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Member List Modal */}
      {memberModalOpen && selectedProject && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseMemberModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Project Members
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProject.name}
                  </p>
                </div>
                <button
                  onClick={handleCloseMemberModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by username or full name..."
                    value={memberSearchInput}
                    onChange={(e) => setMemberSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                {memberSearch && (
                  <p className="text-sm text-gray-500 mt-2">
                    Searching for: "{memberSearch}"
                  </p>
                )}
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-6">
                {memberLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : memberError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-red-600 font-medium">
                        Error loading members
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {memberError}
                      </p>
                    </div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-gray-500 font-medium">
                        No members found
                      </p>
                      {memberSearch && (
                        <p className="text-sm text-gray-400 mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {members.map((member, index) => {
                          const rowNumber =
                            (memberPage - 1) * memberLimit + index + 1;
                          return (
                            <tr
                              key={member.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {rowNumber}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  {member.avatarUrl ? (
                                    <img
                                      src={member.avatarUrl}
                                      alt={member.username}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                      {member.username.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-900">
                                    {member.username}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {member.fullName}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {member.email}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              {members.length > 0 && (
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium">
                      {(memberPage - 1) * memberLimit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(memberPage * memberLimit, memberTotal)}
                    </span>{' '}
                    of <span className="font-medium">{memberTotal}</span>{' '}
                    members
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMemberPrevPage}
                      disabled={memberPage === 1}
                      className={`flex items-center gap-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                        memberPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="px-3 py-1 text-sm text-gray-600">
                        Page {memberPage} of {memberTotalPages}
                      </span>
                    </div>

                    <button
                      onClick={handleMemberNextPage}
                      disabled={memberPage >= memberTotalPages}
                      className={`flex items-center gap-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                        memberPage >= memberTotalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsPage;