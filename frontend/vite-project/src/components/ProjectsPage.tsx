import React, { useState } from 'react';
import { Search, Plus, Users, Calendar, MoreVertical, Star, Folder } from 'lucide-react';

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

interface ProjectsPageProps {
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ onLogout, onNavigate}) => {
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

  const toggleStar = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, starred: !p.starred } : p
    ));
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
                  <button 
                    onClick={() => toggleStar(project.id)}
                    className="text-white hover:scale-110 transition-transform"
                  >
                    <Star size={20} fill={project.starred ? 'currentColor' : 'none'} />
                  </button>
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
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
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
    </div>
  );
};

export default ProjectsPage;