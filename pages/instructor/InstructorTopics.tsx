import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Topic, User } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

export const InstructorTopics: React.FC<{ user: User }> = ({ user }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchTopics = async () => {
    const data = await api.getTopics();
    setTopics(data);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTopic({
      title,
      content,
      authorId: user.id,
      publishDate: new Date().toISOString(),
      isPublished: true, // Explicitly publish
      attachments: [], // Simplified
    });
    setIsCreating(false);
    setTitle('');
    setContent('');
    fetchTopics();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Course Topics</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Topic
        </button>
      </div>

      {isCreating && (
        <div className="glass-panel p-8 rounded-xl border border-white/10 shadow-2xl animate-fade-in-up">
          <h2 className="text-xl font-bold mb-6 text-white">Create New Daily Topic</h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input 
                type="text" 
                required
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-white" 
                placeholder="Topic Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
              <textarea 
                required
                rows={6}
                value={content} 
                onChange={e => setContent(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-white" 
                placeholder="Write your topic explanation here..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Publish Topic
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {topics.map(topic => (
           <div key={topic.id} className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-start group hover:border-white/20 transition-all">
             <div>
               <h3 className="font-bold text-xl text-white mb-1 group-hover:text-blue-300 transition-colors">{topic.title}</h3>
               <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Published: {new Date(topic.publishDate).toLocaleDateString()}</p>
               <p className="text-gray-400 line-clamp-2">{topic.content}</p>
             </div>
             <button className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all bg-white/5 rounded-lg hover:bg-white/10">
               <Trash2 className="w-5 h-5" />
             </button>
           </div>
        ))}
      </div>
    </div>
  );
};
