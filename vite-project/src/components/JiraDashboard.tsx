import React, { useState } from 'react';
import { Star, Users, Plus, MoreHorizontal, Calendar, Bell, Folder, Settings, Table, User } from 'lucide-react';
import { ChevronDown } from 'lucide-react'
interface Card {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

interface JiraDashboardProps {
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

const JiraDashboard: React.FC<JiraDashboardProps> = ({ onLogout, onNavigate }) => {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      cards: [{ id: '1', title: 'Redesign Trello dashboard' }]
    },
    {
      id: 'doing',
      title: 'Doing',
      cards: [{ id: '2', title: 'Redesigning Trello dashboard' }]
    },
    {
      id: 'done',
      title: 'Done',
      cards: [{ id: '3', title: 'Redesigned Trello dashboard' }]
    }
  ]);

  const templates = [
    { id: 1, title: 'Project Management Board', color: 'from-orange-400 to-yellow-500' },
    { id: 2, title: 'Kanban Template', color: 'from-gray-700 to-gray-800' },
    { id: 3, title: 'Simple Project Board', color: 'from-green-600 to-teal-600' },
    { id: 4, title: 'Remote Team Hub', color: 'from-yellow-600 to-orange-700' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-21 bg-purple-500 flex flex-col items-center py-4 space-y-6">
        <div className="text-white font-bold text-xl">Jira</div>
        
        <div className="flex flex-col space-y-4 mt-8">
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
            <User size={20} />
          </button>
          
          <button className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
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
          

          <button 
            onClick={() => onNavigate?.('members')}
            className="flex flex-col items-center text-white hover:bg-purple-600 p-2 rounded">
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
            <button className="text-gray-800 hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Workspace</span>
              <ChevronDown size={16} className="text-gray-800" />
            </button>
            <button className="text-gray-800 hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Recent</span>
              <ChevronDown size={16} className="text-gray-800" />
            </button>
            <button className="text-gray-800 hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Starred</span>
              <ChevronDown size={16} className="text-gray-800" />
            </button>
            <button className="text-gray-800 hover:bg-purple-500 px-3 py-1 rounded flex items-center gap-1">
              <span>Templates</span>
              <ChevronDown size={16} className="text-gray-800" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search"
              className="bg-purple-300 text-black-800 placeholder-grey-800 px-4 py-1.5 rounded focus:outline-none focus:bg-purple-200"
            />
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-1.5 rounded font-medium">
              Create
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded font-medium flex items-center space-x-1">
              <span>⚡</span>
              <span>Try Premium</span>
            </button>

            <button onClick={onLogout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded font-medium"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Create Board Button */}
          <div className="bg-white rounded-lg p-4 mb-6 inline-block shadow-sm">
            <button className="flex items-center space-x-2 text-gray-700 font-medium">
              <span>Create new board</span>
              <Plus size={20} />
            </button>
          </div>

          {/* Invite Button */}
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mb-6 flex items-center space-x-2">
            <Users size={18} />
            <span>Invite Workspace members</span>
          </button>

          {/* Board Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Board</h2>
            
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-gray-700 font-medium">My Design</span>
              <button className="text-gray-500 hover:text-gray-700">
                <Star size={18} />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <Users size={18} />
              </button>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded flex items-center space-x-1">
                <span>Board</span>
                <ChevronDown size={16} className="text-gray-800" />
              </button>
              
            </div>

            {/* Kanban Board */}
            <div className="flex space-x-4 mb-8">
              {columns.map((column) => (
                <div key={column.id} className="bg-gray-100 rounded-lg p-4 w-80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">{column.title}</h3>
                    <button className="text-gray-500 hover:text-gray-700">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  
                  {column.cards.map((card) => (
                    <div key={card.id} className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                      <p className="text-sm text-gray-700">{card.title}</p>
                    </div>
                  ))}
                  
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full">
                    <Plus size={18} />
                    <span>Add a card</span>
                  </button>
                </div>
              ))}
              
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded h-10 flex items-center space-x-2">
                <Plus size={18} />
                <span>Add another list</span>
              </button>
            </div>
          </div>

          {/* Popular Templates */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Popular templates</h2>
                <p className="text-sm text-gray-600">
                  Get going faster with a template from the Trello community or
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <select className="w-64 px-3 py-2 border border-gray-300 rounded mb-6">
              <option>Choose category</option>
            </select>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-gradient-to-br ${template.color} rounded-lg p-6 h-32 relative cursor-pointer hover:opacity-90 transition`}
                >
                  <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs px-2 py-1 rounded">
                    Template
                  </span>
                  <p className="text-white font-medium absolute bottom-3 left-3">
                    {template.title}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-right">
              <a href="#" className="text-cyan-500 hover:text-cyan-600 text-sm font-medium">
                Browse all templates
              </a>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div>
                <label className="text-sm text-gray-600 block mb-2">Sort by</label>
                <select className="px-3 py-2 border border-gray-300 rounded w-48">
                  <option>Most recently active</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 block mb-2">Filter by</label>
                <select className="px-3 py-2 border border-gray-300 rounded w-48">
                  <option>Choose a collection</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 block mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search boards"
                  className="px-3 py-2 border border-gray-300 rounded w-48"
                />
              </div>
            </div>

            {/* Workspace */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded flex items-center justify-center text-white font-bold">
                  J
                </div>
                <span className="font-medium">Jira Workspace</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded">
                  Views
                </button>
                <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded flex items-center space-x-1">
                  <Users size={18} />
                  <span>Members</span>
                </button>
                <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded flex items-center space-x-1">
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded">
                  Upgrade
                </button>
              </div>
            </div>

            {/* My Design Board */}
            <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg p-8 h-32 flex items-center justify-center">
              <span className="text-white text-xl font-medium">My Design</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraDashboard;