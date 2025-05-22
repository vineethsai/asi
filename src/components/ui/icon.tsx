import { FC } from "react";
import {
  ShieldCheck,
  Box,
  MessageCircle,
  FileText,
  CheckCircle2,
  Monitor,
  UserCheck,
  Users,
  Database,
  Shield,
  Filter,
  Repeat,
  AlertCircle,
  Brain,
  Key,
  Zap,
  Bug,
  Target,
  EyeOff,
  User,
  UserX,
  Activity,
  Lock,
  UserCog,
  UserPlus,
  UserMinus,
  Workflow,
  BrainCircuit,
  Cloud
} from "lucide-react";

// Map icon names to Lucide icons
const iconMap: Record<string, FC<{ color?: string; size?: number }>> = {
  // Architectures (existing)
  "flow-linear": ({ color = "#2563eb", size = 28 }) => <Database color={color} size={size} />,
  "flow-hierarchical": ({ color = "#22c55e", size = 28 }) => <Users color={color} size={size} />,
  "flow-swarm": ({ color = "#f59e42", size = 28 }) => <UserCheck color={color} size={size} />,
  "flow-reactive": ({ color = "#eab308", size = 28 }) => <Monitor color={color} size={size} />,
  "flow-knowledge": ({ color = "#a21caf", size = 28 }) => <FileText color={color} size={size} />,
  // Mitigations/Controls
  "shield": ({ color = "#a855f7", size = 28 }) => <ShieldCheck color={color} size={size} />,
  "sandbox": ({ color = "#f87171", size = 28 }) => <Box color={color} size={size} />,
  "comm": ({ color = "#38bdf8", size = 28 }) => <MessageCircle color={color} size={size} />,
  "prompt": ({ color = "#fbbf24", size = 28 }) => <FileText color={color} size={size} />,
  "validate": ({ color = "#34d399", size = 28 }) => <CheckCircle2 color={color} size={size} />,
  "monitor": ({ color = "#818cf8", size = 28 }) => <Monitor color={color} size={size} />,
  "trust": ({ color = "#facc15", size = 28 }) => <Shield color={color} size={size} />,
  "hitl": ({ color = "#60a5fa", size = 28 }) => <Users color={color} size={size} />,
  "resource": ({ color = "#f59e42", size = 28 }) => <Database color={color} size={size} />,
  "defense": ({ color = "#fb7185", size = 28 }) => <ShieldCheck color={color} size={size} />,
  "filter": ({ color = "#4ade80", size = 28 }) => <Filter color={color} size={size} />,
  "lifecycle": ({ color = "#a3e635", size = 28 }) => <Repeat color={color} size={size} />,
  // Threats
  "memory": ({ color = "#a855f7", size = 28 }) => <Brain color={color} size={size} />,
  "tool": ({ color = "#f87171", size = 28 }) => <Zap color={color} size={size} />,
  "privilege": ({ color = "#fbbf24", size = 28 }) => <Key color={color} size={size} />,
  "hallucination": ({ color = "#f472b6", size = 28 }) => <Bug color={color} size={size} />,
  "intent": ({ color = "#34d399", size = 28 }) => <Target color={color} size={size} />,
  "misalign": ({ color = "#818cf8", size = 28 }) => <EyeOff color={color} size={size} />,
  "repudiation": ({ color = "#facc15", size = 28 }) => <UserX color={color} size={size} />,
  "identity": ({ color = "#f472b6", size = 28 }) => <User color={color} size={size} />,
  "rce": ({ color = "#fb7185", size = 28 }) => <Activity color={color} size={size} />,
  "communication": ({ color = "#4ade80", size = 28 }) => <MessageCircle color={color} size={size} />,
  "rogue": ({ color = "#f59e42", size = 28 }) => <UserMinus color={color} size={size} />,
  "human": ({ color = "#fbbf24", size = 28 }) => <UserCog color={color} size={size} />,
  "manipulation": ({ color = "#a3e635", size = 28 }) => <UserPlus color={color} size={size} />,
  Brain: ({ color = "#2563eb", size = 28 }) => <Brain color={color} size={size} />,
  Workflow: ({ color = "#22c55e", size = 28 }) => <Workflow color={color} size={size} />,
  BrainCircuit: ({ color = "#818cf8", size = 28 }) => <BrainCircuit color={color} size={size} />,
  Database: ({ color = "#a855f7", size = 28 }) => <Database color={color} size={size} />,
  Tool: ({ color = "#f87171", size = 28 }) => <Zap color={color} size={size} />,
  Cloud: ({ color = "#38bdf8", size = 28 }) => <Cloud color={color} size={size} />
};

export interface IconProps {
  name?: string;
  color?: string;
  size?: number;
}

export const Icon: FC<IconProps> = ({ name, color, size = 28 }) => {
  if (name && iconMap[name]) {
    const Comp = iconMap[name];
    return <Comp color={color} size={size} />;
  }
  // fallback
  return <AlertCircle color={color || "#64748b"} size={size} />;
};

export default Icon; 