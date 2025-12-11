import React, { useState } from 'react';
import { Search, Users, Mail, Phone, MoreVertical, Folder, Table, Calendar, Bell, Settings, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  teamName: string;
  projectName: string;
  tasks: Task[];
}

interface MembersPageProps {
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

const MembersPage: React.FC<MembersPageProps> = ({ onLogout, onNavigate }) => {
  const [members] = useState<Member[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '+84 123 456 789',
      role: 'Frontend Developer',
      avatar: 'JD',
      teamName: 'Design Team',
      projectName: 'Website Redesign',
      tasks: [
        { id: 't1', title: 'Design homepage layout', status: 'done', dueDate: '2024-01-15' },
        { id: 't2', title: 'Implement responsive design', status: 'in-progress', dueDate: '2024-01-20' },
        { id: 't3', title: 'Review UI components', status: 'todo', dueDate: '2024-01-25' },
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      phone: '+84 987 654 321',
      role: 'Backend Developer',
      avatar: 'JS',
      teamName: 'Engineering Team',
      projectName: 'Mobile App Development',
      tasks: [
        { id: 't4', title: 'Setup API endpoints', status: 'done', dueDate: '2024-01-12' },
        { id: 't5', title: 'Database optimization', status: 'in-progress', dueDate: '2024-01-18' },
        { id: 't6', title: 'Write API documentation', status: 'todo', dueDate: '2024-01-22' },
      ]
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.j@company.com',
      phone: '+84 555 123 456',
      role: 'UI/UX Designer',
      avatar: 'MJ',
      teamName: 'Design Team',
      projectName: 'Website Redesign',
      tasks: [
        { id: 't7', title: 'Create wireframes', status: 'done', dueDate: '2024-01-10' },
        { id: 't8', title: 'Design mockups', status: 'in-progress', dueDate: '2024-01-16' },
        { id: 't9', title: 'User testing', status: 'todo', dueDate: '2024-01-28' },
      ]
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.w@company.com',
      phone: '+84 777 888 999',
      role: 'Marketing Manager',
      avatar: 'SW',
      teamName: 'Marketing Team',
      projectName: 'Marketing Campaign',
      tasks: [
        { id: 't10', title: 'Create content calendar', status: 'done', dueDate: '2024-01-08' },
        { id: 't11', title: 'Social media strategy', status: 'in-progress', dueDate: '2024-01-19' },
        { id: 't12', title: 'Email campaign', status: 'todo', dueDate: '2024-01-30' },
      ]
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david.b@company.com',
      phone: '+84 333 444 555',
      role: 'DevOps Engineer',
      avatar: 'DB',
      teamName: 'DevOps Team',
      projectName: 'Database Migration',
      tasks: [
        { id: 't13', title: 'Server setup', status: 'done', dueDate: '2024-01-11' },
        { id: 't14', title: 'CI/CD pipeline', status: 'in-progress', dueDate: '2024-01-17' },
        { id: 't15', title: 'Security audit', status: 'todo', dueDate: '2024-01-26' },
      ]
    },
    {
      id: '6',
      name: 'Emily Davis',
      email: 'emily.d@company.com',
      phone: '+84 222 333 444',
      role: 'Product Manager',
      avatar: 'ED',
      teamName: 'Engineering Team',
      projectName: 'Mobile App Development',
      tasks: [
        { id: 't16', title: 'Product roadmap', status: 'done', dueDate: '2024-01-09' },
        { id: 't17', title: 'Feature prioritization', status: 'in-progress', dueDate: '2024-01-21' },
        { id: 't18', title: 'Stakeholder meeting', status: 'todo', dueDate: '2024-01-27' },
      ]
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.teamName.toLowerCase().includes(query) ||
      member.projectName.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.tasks.some(task => task.title.toLowerCase().includes(query))
    );
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'todo': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'done': return 'Done';
      case 'in-progress': return 'In Progress';
      case 'todo': return 'To Do';
      default: return status;
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-green-400 to-green-600',
      'from-pink-400 to-pink-600',
      'from-orange-400 to-orange-600',
      'from-teal-400 to-teal-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-20 bg-purple-500 flex flex-col items-center py-4 space-y-6">
        <div className="text-white font-bold text-xl">Jira</div>
        
        <div className="flex flex-col space-y-4 mt-8">
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <User size={20} />
          </button>
          
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded"
          >
            <Table size={20} />
            <span className="text-xs mt-1">Boards</span>
          </button>

          <button 
            onClick={() => onNavigate?.('projects')}
            className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded"
          >
            <Folder size={20} />
            <span className="text-xs mt-1">Projects</span>
          </button>

          <button className="flex flex-col items-center text-white bg-purple-600 p-2 rounded">
            <Users size={20} />
            <span className="text-xs mt-1">Members</span>
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Table size={20} />
            <span className="text-xs mt-1">Table</span>
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Calendar size={20} />
            <span className="text-xs mt-1">Calendar</span>
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Bell size={20} />
            <span className="text-xs mt-1">Reports</span>
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Bell size={20} />
            <span className="text-xs mt-1">Notifications</span>
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <Settings size={20} />
            <span className="text-xs mt-1">Settings</span>
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
              <span className="text-gray-800">▼</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Recent</span>
              <span className="text-gray-800">▼</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Starred</span>
              <span className="text-gray-800">▼</span>
            </button>
            <button className="text-white hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Templates</span>
              <span className="text-gray-800">▼</span>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Members</h1>
            <p className="text-gray-600">Manage and view all team members across projects</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, team, project, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
            </div>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member, index) => (
              <div 
                key={member.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow relative"
                onMouseEnter={() => setHoveredMember(member.id)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                {/* Member Card */}
                <div className="p-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 truncate">{member.name}</h3>
                      <p className="text-sm text-purple-600 font-medium">{member.role}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Users size={12} className="mr-1" />
                        <span className="truncate">{member.teamName}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  {/* Project Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Folder size={14} className="mr-2 text-purple-500" />
                      <span className="font-medium">Project:</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium ml-6">{member.projectName}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                  </div>

                  {/* Task Summary */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Tasks: {member.tasks.length}</span>
                      <div className="flex space-x-1">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          {member.tasks.filter(t => t.status === 'done').length} Done
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          {member.tasks.filter(t => t.status === 'in-progress').length} Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay - Tasks Detail */}
                {hoveredMember === member.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800">Tasks & Responsibilities</h4>
                      <button 
                        onClick={() => setHoveredMember(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      {member.tasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
                            <span className={`w-3 h-3 ${getTaskStatusColor(task.status)} rounded-full flex-shrink-0 ml-2 mt-0.5`}></span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-1 rounded ${
                              task.status === 'done' ? 'bg-green-100 text-green-700' :
                              task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {getTaskStatusText(task.status)}
                            </span>
                            <span className="text-gray-500">Due: {task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No members found</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;