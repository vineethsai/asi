import React from 'react';

interface ArchitectureDiagramProps {
  architectureId: string;
  className?: string;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ 
  architectureId, 
  className = "w-full h-64" 
}) => {
  const renderSequentialDiagram = () => (
    <svg viewBox="0 0 600 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sequentialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
        </linearGradient>
        <marker id="sequentialArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#sequentialGradient)" rx="12" />
      
      {/* Input */}
      <g>
        <rect x="30" y="80" width="80" height="40" rx="8" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2" />
        <text x="70" y="105" textAnchor="middle" className="text-sm font-medium fill-blue-700">
          Input
        </text>
      </g>
      
      {/* Processing Steps */}
      <g>
        <rect x="150" y="60" width="80" height="80" rx="8" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="2" />
        <text x="190" y="90" textAnchor="middle" className="text-xs font-medium fill-purple-700">
          LLM Core
        </text>
        <text x="190" y="105" textAnchor="middle" className="text-xs fill-purple-600">
          (KC1.1)
        </text>
        <text x="190" y="120" textAnchor="middle" className="text-xs fill-purple-600">
          Chain of
        </text>
        <text x="190" y="135" textAnchor="middle" className="text-xs fill-purple-600">
          Thought
        </text>
      </g>
      
      <g>
        <rect x="270" y="80" width="80" height="40" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="310" y="95" textAnchor="middle" className="text-xs font-medium fill-amber-700">
          Memory
        </text>
        <text x="310" y="110" textAnchor="middle" className="text-xs fill-amber-600">
          (KC4.1)
        </text>
      </g>
      
      <g>
        <rect x="390" y="80" width="80" height="40" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <text x="430" y="95" textAnchor="middle" className="text-xs font-medium fill-green-700">
          API Access
        </text>
        <text x="430" y="110" textAnchor="middle" className="text-xs fill-green-600">
          (KC6.1.1)
        </text>
      </g>
      
      {/* Output */}
      <g>
        <rect x="510" y="80" width="70" height="40" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
        <text x="545" y="105" textAnchor="middle" className="text-sm font-medium fill-red-700">
          Output
        </text>
      </g>
      
      {/* Arrows */}
      <line x1="110" y1="100" x2="150" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#sequentialArrow)" />
      <line x1="230" y1="100" x2="270" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#sequentialArrow)" />
      <line x1="350" y1="100" x2="390" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#sequentialArrow)" />
      <line x1="470" y1="100" x2="510" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#sequentialArrow)" />
      
      {/* Title */}
      <text x="300" y="25" textAnchor="middle" className="text-lg font-bold fill-blue-800">
        Sequential Agent Architecture
      </text>
      <text x="300" y="45" textAnchor="middle" className="text-sm fill-blue-600">
        Linear workflow with single LLM processing
      </text>
    </svg>
  );

  const renderHierarchicalDiagram = () => (
    <svg viewBox="0 0 600 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hierarchicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#15803d" stopOpacity="0.1" />
        </linearGradient>
        <marker id="hierarchicalArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
        </marker>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#hierarchicalGradient)" rx="12" />
      
      {/* Title */}
      <text x="300" y="25" textAnchor="middle" className="text-lg font-bold fill-green-800">
        Hierarchical Agent Architecture
      </text>
      <text x="300" y="45" textAnchor="middle" className="text-sm fill-green-600">
        Orchestrator delegates tasks to specialized sub-agents
      </text>
      
      {/* Orchestrator */}
      <g>
        <rect x="225" y="70" width="150" height="50" rx="12" fill="#dcfce7" stroke="#22c55e" strokeWidth="3" />
        <text x="300" y="90" textAnchor="middle" className="text-sm font-bold fill-green-800">
          Orchestrator Agent
        </text>
        <text x="300" y="105" textAnchor="middle" className="text-xs fill-green-600">
          Hierarchical Planning (KC2.2)
        </text>
      </g>
      
      {/* Sub-agents */}
      <g>
        <rect x="50" y="180" width="100" height="60" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="100" y="200" textAnchor="middle" className="text-xs font-bold fill-amber-800">
          Specialist A
        </text>
        <text x="100" y="215" textAnchor="middle" className="text-xs fill-amber-600">
          Fine-tuned
        </text>
        <text x="100" y="230" textAnchor="middle" className="text-xs fill-amber-600">
          (KC1.4)
        </text>
      </g>
      
      <g>
        <rect x="175" y="180" width="100" height="60" rx="8" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2" />
        <text x="225" y="200" textAnchor="middle" className="text-xs font-bold fill-blue-800">
          Specialist B
        </text>
        <text x="225" y="215" textAnchor="middle" className="text-xs fill-blue-600">
          LLM Core
        </text>
        <text x="225" y="230" textAnchor="middle" className="text-xs fill-blue-600">
          (KC1.1)
        </text>
      </g>
      
      <g>
        <rect x="325" y="180" width="100" height="60" rx="8" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
        <text x="375" y="200" textAnchor="middle" className="text-xs font-bold fill-pink-800">
          Specialist C
        </text>
        <text x="375" y="215" textAnchor="middle" className="text-xs fill-pink-600">
          Multimodal
        </text>
        <text x="375" y="230" textAnchor="middle" className="text-xs fill-pink-600">
          (KC1.2)
        </text>
      </g>
      
      <g>
        <rect x="450" y="180" width="100" height="60" rx="8" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
        <text x="500" y="200" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          Specialist D
        </text>
        <text x="500" y="215" textAnchor="middle" className="text-xs fill-purple-600">
          Code Exec
        </text>
        <text x="500" y="230" textAnchor="middle" className="text-xs fill-purple-600">
          (KC6.2)
        </text>
      </g>
      
      {/* Communication lines */}
      <line x1="270" y1="120" x2="100" y2="180" stroke="#22c55e" strokeWidth="2" markerEnd="url(#hierarchicalArrow)" />
      <line x1="290" y1="120" x2="225" y2="180" stroke="#22c55e" strokeWidth="2" markerEnd="url(#hierarchicalArrow)" />
      <line x1="310" y1="120" x2="375" y2="180" stroke="#22c55e" strokeWidth="2" markerEnd="url(#hierarchicalArrow)" />
      <line x1="330" y1="120" x2="500" y2="180" stroke="#22c55e" strokeWidth="2" markerEnd="url(#hierarchicalArrow)" />
      
      {/* Shared Memory */}
      <g>
        <ellipse cx="300" cy="260" rx="80" ry="20" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5" />
        <text x="300" y="265" textAnchor="middle" className="text-xs font-medium fill-green-700">
          Shared Memory (KC4.2)
        </text>
      </g>
    </svg>
  );

  const renderCollaborativeDiagram = () => (
    <svg viewBox="0 0 600 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="swarmGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
        </radialGradient>
        <marker id="swarmArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
        </marker>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#swarmGradient)" rx="12" />
      
      {/* Title */}
      <text x="300" y="25" textAnchor="middle" className="text-lg font-bold fill-amber-800">
        Collaborative Swarm Architecture
      </text>
      <text x="300" y="45" textAnchor="middle" className="text-sm fill-amber-600">
        Decentralized peer-to-peer agent collaboration
      </text>
      
      {/* Central Knowledge Hub */}
      <g>
        <ellipse cx="300" cy="150" rx="60" ry="40" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,4" />
        <text x="300" y="145" textAnchor="middle" className="text-xs font-bold fill-amber-800">
          Shared Knowledge
        </text>
        <text x="300" y="160" textAnchor="middle" className="text-xs fill-amber-600">
          (KC4.4)
        </text>
      </g>
      
      {/* Swarm Agents */}
      <g>
        <circle cx="150" cy="100" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="150" y="95" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 1
        </text>
        <text x="150" y="108" textAnchor="middle" className="text-xs fill-orange-600">
          Explorer
        </text>
      </g>
      
      <g>
        <circle cx="450" cy="100" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="450" y="95" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 2
        </text>
        <text x="450" y="108" textAnchor="middle" className="text-xs fill-orange-600">
          Analyzer
        </text>
      </g>
      
      <g>
        <circle cx="120" cy="200" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="120" y="195" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 3
        </text>
        <text x="120" y="208" textAnchor="middle" className="text-xs fill-orange-600">
          Validator
        </text>
      </g>
      
      <g>
        <circle cx="480" cy="200" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="480" y="195" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 4
        </text>
        <text x="480" y="208" textAnchor="middle" className="text-xs fill-orange-600">
          Synthesizer
        </text>
      </g>
      
      <g>
        <circle cx="300" cy="70" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="300" y="65" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 5
        </text>
        <text x="300" y="78" textAnchor="middle" className="text-xs fill-orange-600">
          Coordinator
        </text>
      </g>
      
      <g>
        <circle cx="300" cy="230" r="35" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <text x="300" y="225" textAnchor="middle" className="text-xs font-bold fill-orange-800">
          Agent 6
        </text>
        <text x="300" y="238" textAnchor="middle" className="text-xs fill-orange-600">
          Executor
        </text>
      </g>
      
      {/* Communication lines - peer to peer */}
      <line x1="185" y1="100" x2="265" y2="105" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      <line x1="415" y1="100" x2="335" y2="105" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      <line x1="300" y1="105" x2="300" y2="110" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      <line x1="155" y1="165" x2="265" y2="185" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      <line x1="445" y1="165" x2="335" y2="185" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      <line x1="300" y1="195" x2="300" y2="190" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#swarmArrow)" />
      
      {/* Cross communications */}
      <line x1="185" y1="120" x2="415" y2="180" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
      <line x1="155" y1="180" x2="415" y2="120" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
      <line x1="265" y1="90" x2="155" y2="165" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
      <line x1="335" y1="90" x2="445" y2="165" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
    </svg>
  );

  const renderReactiveDiagram = () => (
    <svg viewBox="0 0 600 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="reactiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eab308" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.1" />
        </linearGradient>
        <marker id="reactiveArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
        </marker>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#reactiveGradient)" rx="12" />
      
      {/* Title */}
      <text x="300" y="25" textAnchor="middle" className="text-lg font-bold fill-yellow-800">
        Reactive Agent Architecture
      </text>
      <text x="300" y="45" textAnchor="middle" className="text-sm fill-yellow-600">
        Event-driven responses with ReAct paradigm
      </text>
      
      {/* Event Sources */}
      <g>
        <rect x="30" y="80" width="80" height="40" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="70" y="95" textAnchor="middle" className="text-xs font-bold fill-amber-800">
          User Input
        </text>
        <text x="70" y="108" textAnchor="middle" className="text-xs fill-amber-600">
          Events
        </text>
      </g>
      
      <g>
        <rect x="30" y="140" width="80" height="40" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="70" y="155" textAnchor="middle" className="text-xs font-bold fill-amber-800">
          System
        </text>
        <text x="70" y="168" textAnchor="middle" className="text-xs fill-amber-600">
          Triggers
        </text>
      </g>
      
      <g>
        <rect x="30" y="200" width="80" height="40" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="70" y="215" textAnchor="middle" className="text-xs font-bold fill-amber-800">
          External
        </text>
        <text x="70" y="228" textAnchor="middle" className="text-xs fill-amber-600">
          Signals
        </text>
      </g>
      
      {/* Reactive Agent Core */}
      <g>
        <rect x="200" y="120" width="120" height="80" rx="12" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
        <text x="260" y="140" textAnchor="middle" className="text-sm font-bold fill-amber-900">
          Reactive Agent
        </text>
        <text x="260" y="155" textAnchor="middle" className="text-xs fill-amber-700">
          ReAct Paradigm
        </text>
        <text x="260" y="170" textAnchor="middle" className="text-xs fill-amber-700">
          Reason → Act
        </text>
        <text x="260" y="185" textAnchor="middle" className="text-xs fill-amber-600">
          (KC3.2)
        </text>
      </g>
      
      {/* Action Outputs */}
      <g>
        <rect x="400" y="80" width="80" height="40" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <text x="440" y="95" textAnchor="middle" className="text-xs font-bold fill-green-800">
          API Calls
        </text>
        <text x="440" y="108" textAnchor="middle" className="text-xs fill-green-600">
          (KC6.4)
        </text>
      </g>
      
      <g>
        <rect x="400" y="140" width="80" height="40" rx="8" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2" />
        <text x="440" y="155" textAnchor="middle" className="text-xs font-bold fill-blue-800">
          Responses
        </text>
        <text x="440" y="168" textAnchor="middle" className="text-xs fill-blue-600">
          Generation
        </text>
      </g>
      
      <g>
        <rect x="400" y="200" width="80" height="40" rx="8" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
        <text x="440" y="215" textAnchor="middle" className="text-xs font-bold fill-pink-800">
          Notifications
        </text>
        <text x="440" y="228" textAnchor="middle" className="text-xs fill-pink-600">
          Alerts
        </text>
      </g>
      
      {/* Event Memory */}
      <g>
        <ellipse cx="260" cy="270" rx="70" ry="20" fill="#fef9c3" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" />
        <text x="260" y="275" textAnchor="middle" className="text-xs font-medium fill-yellow-700">
          Event Memory (KC4.3)
        </text>
      </g>
      
      {/* Arrows */}
      <line x1="110" y1="100" x2="200" y2="140" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      <line x1="110" y1="160" x2="200" y2="160" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      <line x1="110" y1="220" x2="200" y2="180" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      
      <line x1="320" y1="140" x2="400" y2="100" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      <line x1="320" y1="160" x2="400" y2="160" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      <line x1="320" y1="180" x2="400" y2="220" stroke="#eab308" strokeWidth="2" markerEnd="url(#reactiveArrow)" />
      
      {/* Memory connection */}
      <line x1="260" y1="200" x2="260" y2="250" stroke="#eab308" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#reactiveArrow)" />
    </svg>
  );

  const renderKnowledgeIntensiveDiagram = () => (
    <svg viewBox="0 0 600 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="knowledgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a21caf" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.1" />
        </linearGradient>
        <marker id="knowledgeArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#a21caf" />
        </marker>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#knowledgeGradient)" rx="12" />
      
      {/* Title */}
      <text x="300" y="25" textAnchor="middle" className="text-lg font-bold fill-purple-800">
        Knowledge-Intensive Architecture
      </text>
      <text x="300" y="45" textAnchor="middle" className="text-sm fill-purple-600">
        RAG-based processing with external knowledge integration
      </text>
      
      {/* Knowledge Sources */}
      <g>
        <rect x="30" y="80" width="100" height="50" rx="8" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
        <text x="80" y="95" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          Document Store
        </text>
        <text x="80" y="108" textAnchor="middle" className="text-xs fill-purple-600">
          Vector DB
        </text>
        <text x="80" y="121" textAnchor="middle" className="text-xs fill-purple-600">
          (KC4.6)
        </text>
      </g>
      
      <g>
        <rect x="30" y="150" width="100" height="50" rx="8" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
        <text x="80" y="165" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          External APIs
        </text>
        <text x="80" y="178" textAnchor="middle" className="text-xs fill-purple-600">
          Data Sources
        </text>
        <text x="80" y="191" textAnchor="middle" className="text-xs fill-purple-600">
          (KC6.3.3)
        </text>
      </g>
      
      {/* RAG Pipeline */}
      <g>
        <rect x="180" y="100" width="100" height="60" rx="10" fill="#fae8ff" stroke="#c084fc" strokeWidth="2" />
        <text x="230" y="120" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          Retrieval
        </text>
        <text x="230" y="135" textAnchor="middle" className="text-xs fill-purple-600">
          Augmented
        </text>
        <text x="230" y="150" textAnchor="middle" className="text-xs fill-purple-600">
          Generation
        </text>
      </g>
      
      {/* Knowledge Agent Core */}
      <g>
        <rect x="320" y="90" width="120" height="80" rx="12" fill="#e879f9" stroke="#a21caf" strokeWidth="3" />
        <text x="380" y="110" textAnchor="middle" className="text-sm font-bold fill-white">
          Knowledge Agent
        </text>
        <text x="380" y="125" textAnchor="middle" className="text-xs fill-purple-100">
          Chain of Thought
        </text>
        <text x="380" y="140" textAnchor="middle" className="text-xs fill-purple-100">
          (KC3.3)
        </text>
        <text x="380" y="155" textAnchor="middle" className="text-xs fill-purple-100">
          LLM + MLLM (KC1.1/1.2)
        </text>
      </g>
      
      {/* Output Processing */}
      <g>
        <rect x="480" y="100" width="100" height="60" rx="10" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
        <text x="530" y="120" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          Synthesized
        </text>
        <text x="530" y="135" textAnchor="middle" className="text-xs fill-purple-600">
          Knowledge
        </text>
        <text x="530" y="150" textAnchor="middle" className="text-xs fill-purple-600">
          Response
        </text>
      </g>
      
      {/* Persistent Memory */}
      <g>
        <ellipse cx="300" cy="220" rx="90" ry="25" fill="#f8fafc" stroke="#a21caf" strokeWidth="2" strokeDasharray="6,4" />
        <text x="300" y="215" textAnchor="middle" className="text-xs font-bold fill-purple-800">
          Persistent Knowledge Cache
        </text>
        <text x="300" y="230" textAnchor="middle" className="text-xs fill-purple-600">
          Cross-session Memory (KC4.3)
        </text>
      </g>
      
      {/* Query Input */}
      <g>
        <rect x="180" y="40" width="100" height="35" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="230" y="60" textAnchor="middle" className="text-sm font-bold fill-amber-800">
          Query Input
        </text>
      </g>
      
      {/* Arrows */}
      <line x1="130" y1="105" x2="180" y2="120" stroke="#a21caf" strokeWidth="2" markerEnd="url(#knowledgeArrow)" />
      <line x1="130" y1="175" x2="180" y2="150" stroke="#a21caf" strokeWidth="2" markerEnd="url(#knowledgeArrow)" />
      <line x1="280" y1="130" x2="320" y2="130" stroke="#a21caf" strokeWidth="2" markerEnd="url(#knowledgeArrow)" />
      <line x1="440" y1="130" x2="480" y2="130" stroke="#a21caf" strokeWidth="2" markerEnd="url(#knowledgeArrow)" />
      <line x1="230" y1="75" x2="230" y2="100" stroke="#a21caf" strokeWidth="2" markerEnd="url(#knowledgeArrow)" />
      
      {/* Memory connections */}
      <line x1="350" y1="170" x2="330" y2="195" stroke="#a21caf" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#knowledgeArrow)" />
      <line x1="270" y1="195" x2="250" y2="170" stroke="#a21caf" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#knowledgeArrow)" />
    </svg>
  );

  switch (architectureId) {
    case 'sequential':
      return renderSequentialDiagram();
    case 'hierarchical':
      return renderHierarchicalDiagram();
    case 'collaborative':
    case 'swarm':
      return renderCollaborativeDiagram();
    case 'reactive':
      return renderReactiveDiagram();
    case 'knowledge_intensive':
      return renderKnowledgeIntensiveDiagram();
    default:
      return (
        <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
          <p className="text-muted-foreground">Architecture diagram not available</p>
        </div>
      );
  }
};

export default ArchitectureDiagram; 