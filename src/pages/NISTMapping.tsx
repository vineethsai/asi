import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aisvsData } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { Helmet } from "react-helmet";
import { Search, Shield, Target, ExternalLink, GitBranch, ArrowRight, CheckCircle, AlertTriangle, BookOpen, Network, Layers, RotateCcw, Maximize } from "lucide-react";

// NIST AI RMF Framework Structure
interface NISTFunction {
  id: string;
  code: string;
  name: string;
  description: string;
  categories: NISTCategory[];
  color: string;
  icon: string;
}

interface NISTCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  subcategories: NISTSubcategory[];
}

interface NISTSubcategory {
  id: string;
  code: string;
  name: string;
  description: string;
  aisvsMapping: string[]; // AISVS category codes that map to this subcategory
}

// NIST AI RMF Data Structure
const nistAIRMF: NISTFunction[] = [
  {
    id: "govern",
    code: "GOVERN",
    name: "Govern",
    description: "The organization's approach to managing AI risk is addressed through organizational governance structures and processes.",
    color: "#3b82f6",
    icon: "shield",
    categories: [
      {
        id: "govern.1",
        code: "GOVERN.1",
        name: "Policies, Processes, Procedures, and Practices",
        description: "Policies, processes, procedures, and practices across the organization related to the mapping, measuring, and managing of AI risks are in place, transparent, and implemented effectively.",
        subcategories: [
          {
            id: "govern.1.1",
            code: "GOVERN.1.1",
            name: "Legal and Regulatory Requirements",
            description: "Legal and regulatory requirements involving AI are understood, managed, and documented.",
            aisvsMapping: ["C1", "C5", "C11"]
          },
          {
            id: "govern.1.2",
            code: "GOVERN.1.2",
            name: "Trustworthy AI Characteristics Integration",
            description: "The characteristics of trustworthy AI are integrated into organizational policies, processes, procedures, and practices.",
            aisvsMapping: ["C1", "C3", "C11", "C13"]
          },
          {
            id: "govern.1.3",
            code: "GOVERN.1.3",
            name: "Risk Management Activity Levels",
            description: "Processes, procedures, and practices are in place to determine the needed level of risk management activities based on the organization's risk tolerance.",
            aisvsMapping: ["C3", "C12"]
          },
          {
            id: "govern.1.4",
            code: "GOVERN.1.4",
            name: "Risk Management Process Establishment",
            description: "The risk management process and its outcomes are established through transparent policies, procedures, and other controls based on organizational risk priorities.",
            aisvsMapping: ["C1", "C3", "C12"]
          },
          {
            id: "govern.1.5",
            code: "GOVERN.1.5",
            name: "Ongoing Monitoring and Review",
            description: "Ongoing monitoring and periodic review of the risk management process and its outcomes are planned and organizational roles and responsibilities clearly defined, including determining the frequency of periodic review.",
            aisvsMapping: ["C12", "C13"]
          },
          {
            id: "govern.1.6",
            code: "GOVERN.1.6",
            name: "AI Systems Inventory",
            description: "Mechanisms are in place to inventory AI systems and are resourced according to organizational risk priorities.",
            aisvsMapping: ["C3", "C5"]
          },
          {
            id: "govern.1.7",
            code: "GOVERN.1.7",
            name: "Decommissioning Procedures",
            description: "Processes and procedures are in place for decommissioning and phasing out AI systems safely and in a manner that does not increase risks or decrease the organization's trustworthiness.",
            aisvsMapping: ["C12", "C13"]
          }
        ]
      },
      {
        id: "govern.2",
        code: "GOVERN.2",
        name: "Accountability Structures",
        description: "Accountability structures are in place so that the appropriate teams and individuals are empowered, responsible, and trained for mapping, measuring, and managing AI risks.",
        subcategories: [
          {
            id: "govern.2.1",
            code: "GOVERN.2.1",
            name: "Roles and Responsibilities",
            description: "Roles and responsibilities and lines of communication related to mapping, measuring, and managing AI risks are documented and are clear to individuals and teams throughout the organization.",
            aisvsMapping: ["C5", "C13"]
          },
          {
            id: "govern.2.2",
            code: "GOVERN.2.2",
            name: "AI Risk Management Training",
            description: "The organization's personnel and partners receive AI risk management training to enable them to perform their duties and responsibilities consistent with related policies, procedures, and agreements.",
            aisvsMapping: ["C5", "C13"]
          },
          {
            id: "govern.2.3",
            code: "GOVERN.2.3",
            name: "Executive Leadership Responsibility",
            description: "Executive leadership of the organization takes responsibility for decisions about risks associated with AI system development and deployment.",
            aisvsMapping: ["C5", "C13"]
          }
        ]
      },
      {
        id: "govern.3",
        code: "GOVERN.3",
        name: "Workforce Diversity and Inclusion",
        description: "Workforce diversity, equity, inclusion, and accessibility processes are prioritized in the mapping, measuring, and managing of AI risks throughout the lifecycle.",
        subcategories: [
          {
            id: "govern.3.1",
            code: "GOVERN.3.1",
            name: "Diverse Decision-Making Teams",
            description: "Decision-making related to mapping, measuring, and managing AI risks throughout the lifecycle is informed by a diverse team (e.g., diversity of demographics, disciplines, experience, expertise, and backgrounds).",
            aisvsMapping: ["C11", "C13"]
          },
          {
            id: "govern.3.2",
            code: "GOVERN.3.2",
            name: "Human-AI Configuration Roles",
            description: "Policies and procedures are in place to define and differentiate roles and responsibilities for human-AI configurations and oversight of AI systems.",
            aisvsMapping: ["C7", "C13"]
          }
        ]
      },
      {
        id: "govern.4",
        code: "GOVERN.4",
        name: "Risk Communication Culture",
        description: "Organizational teams are committed to a culture that considers and communicates AI risk.",
        subcategories: [
          {
            id: "govern.4.1",
            code: "GOVERN.4.1",
            name: "Critical Thinking and Safety Mindset",
            description: "Organizational policies and practices are in place to foster a critical thinking and safety-first mindset in the design, development, deployment, and uses of AI systems to minimize potential negative impacts.",
            aisvsMapping: ["C1", "C3", "C13"]
          },
          {
            id: "govern.4.2",
            code: "GOVERN.4.2",
            name: "Risk Documentation and Communication",
            description: "Organizational teams document the risks and potential impacts of the AI technology they design, develop, deploy, evaluate, and use, and they communicate about the impacts more broadly.",
            aisvsMapping: ["C3", "C11", "C12"]
          },
          {
            id: "govern.4.3",
            code: "GOVERN.4.3",
            name: "Testing and Information Sharing",
            description: "Organizational practices are in place to enable AI testing, identification of incidents, and information sharing.",
            aisvsMapping: ["C10", "C12", "C13"]
          }
        ]
      },
      {
        id: "govern.5",
        code: "GOVERN.5",
        name: "Stakeholder Engagement",
        description: "Processes are in place for robust engagement with relevant AI actors.",
        subcategories: [
          {
            id: "govern.5.1",
            code: "GOVERN.5.1",
            name: "External Feedback Collection",
            description: "Organizational policies and practices are in place to collect, consider, prioritize, and integrate feedback from those external to the team that developed or deployed the AI system regarding the potential individual and societal impacts related to AI risks.",
            aisvsMapping: ["C11", "C12", "C13"]
          },
          {
            id: "govern.5.2",
            code: "GOVERN.5.2",
            name: "Feedback Integration Mechanisms",
            description: "Mechanisms are established to enable the team that developed or deployed AI systems to regularly incorporate adjudicated feedback from relevant AI actors into system design and implementation.",
            aisvsMapping: ["C11", "C12", "C13"]
          }
        ]
      },
      {
        id: "govern.6",
        code: "GOVERN.6",
        name: "Third-Party Risk Management",
        description: "Policies and procedures are in place to address AI risks and benefits arising from third-party software and data and other supply chain issues.",
        subcategories: [
          {
            id: "govern.6.1",
            code: "GOVERN.6.1",
            name: "Third-Party Risk Policies",
            description: "Policies and procedures are in place that address AI risks associated with third-party entities, including risks of infringement of a third-party's intellectual property or other rights.",
            aisvsMapping: ["C6"]
          },
          {
            id: "govern.6.2",
            code: "GOVERN.6.2",
            name: "Third-Party Contingency Processes",
            description: "Contingency processes are in place to handle failures or incidents in third-party data or AI systems deemed to be high-risk.",
            aisvsMapping: ["C6", "C12"]
          }
        ]
      }
    ]
  },
  {
    id: "map",
    code: "MAP",
    name: "Map",
    description: "The organization's approach to understanding AI system contexts, risks, and impacts is established.",
    color: "#10b981",
    icon: "network",
    categories: [
      {
        id: "map.1",
        code: "MAP.1",
        name: "Context Establishment",
        description: "Context is established and understood.",
        subcategories: [
          {
            id: "map.1.1",
            code: "MAP.1.1",
            name: "Intended Purposes and Context",
            description: "Intended purposes, potentially beneficial uses, context-specific laws, norms and expectations, and prospective settings in which the AI system will be deployed are understood and documented.",
            aisvsMapping: ["C1", "C3", "C7"]
          },
          {
            id: "map.1.2",
            code: "MAP.1.2",
            name: "Interdisciplinary Team Diversity",
            description: "Interdisciplinary AI actors, competencies, skills, and capacities for establishing context reflect demographic diversity and broad domain and user experience expertise, and their participation is documented.",
            aisvsMapping: ["C11", "C13"]
          },
          {
            id: "map.1.3",
            code: "MAP.1.3",
            name: "Organizational Mission and Goals",
            description: "The organization's mission and relevant goals for AI technology are understood and documented.",
            aisvsMapping: ["C1", "C3"]
          },
          {
            id: "map.1.4",
            code: "MAP.1.4",
            name: "Business Value Definition",
            description: "The business value or context of business use has been clearly defined or – in the case of assessing existing AI systems – re-evaluated.",
            aisvsMapping: ["C3", "C7"]
          },
          {
            id: "map.1.5",
            code: "MAP.1.5",
            name: "Risk Tolerance Documentation",
            description: "Organizational risk tolerances are determined and documented.",
            aisvsMapping: ["C3", "C12"]
          },
          {
            id: "map.1.6",
            code: "MAP.1.6",
            name: "System Requirements",
            description: "System requirements are elicited from and understood by relevant AI actors. Design decisions take socio-technical implications into account to address AI risks.",
            aisvsMapping: ["C1", "C3", "C7", "C11"]
          }
        ]
      },
      {
        id: "map.2",
        code: "MAP.2",
        name: "AI System Categorization",
        description: "Categorization of the AI system is performed.",
        subcategories: [
          {
            id: "map.2.1",
            code: "MAP.2.1",
            name: "Task and Method Definition",
            description: "The specific tasks and methods used to implement the tasks that the AI system will support are defined (e.g., classifiers, generative models, recommenders).",
            aisvsMapping: ["C3", "C7"]
          },
          {
            id: "map.2.2",
            code: "MAP.2.2",
            name: "Knowledge Limits Documentation",
            description: "Information about the AI system's knowledge limits and how system output may be utilized and overseen by humans is documented.",
            aisvsMapping: ["C7", "C13"]
          },
          {
            id: "map.2.3",
            code: "MAP.2.3",
            name: "Scientific Integrity and TEVV",
            description: "Scientific integrity and TEVV considerations are identified and documented, including those related to experimental design, data collection and selection, system trustworthiness, and construct validation.",
            aisvsMapping: ["C1", "C10", "C11"]
          }
        ]
      },
      {
        id: "map.3",
        code: "MAP.3",
        name: "AI Capabilities Assessment",
        description: "AI capabilities, targeted usage, goals, and expected benefits and costs compared with appropriate benchmarks are understood.",
        subcategories: [
          {
            id: "map.3.1",
            code: "MAP.3.1",
            name: "Potential Benefits Documentation",
            description: "Potential benefits of intended AI system functionality and performance are examined and documented.",
            aisvsMapping: ["C3", "C7"]
          },
          {
            id: "map.3.2",
            code: "MAP.3.2",
            name: "Potential Costs Assessment",
            description: "Potential costs, including non-monetary costs, which result from expected or realized AI errors or system functionality and trustworthiness are examined and documented.",
            aisvsMapping: ["C3", "C11", "C12"]
          },
          {
            id: "map.3.3",
            code: "MAP.3.3",
            name: "Application Scope Specification",
            description: "Targeted application scope is specified and documented based on the system's capability, established context, and AI system categorization.",
            aisvsMapping: ["C3", "C7"]
          },
          {
            id: "map.3.4",
            code: "MAP.3.4",
            name: "Operator Proficiency Processes",
            description: "Processes for operator and practitioner proficiency with AI system performance and trustworthiness are defined, assessed, and documented.",
            aisvsMapping: ["C5", "C13"]
          },
          {
            id: "map.3.5",
            code: "MAP.3.5",
            name: "Human Oversight Processes",
            description: "Processes for human oversight are defined, assessed, and documented in accordance with organizational policies from the GOVERN function.",
            aisvsMapping: ["C7", "C13"]
          }
        ]
      },
      {
        id: "map.4",
        code: "MAP.4",
        name: "Component Risk Mapping",
        description: "Risks and benefits are mapped for all components of the AI system including third-party software and data.",
        subcategories: [
          {
            id: "map.4.1",
            code: "MAP.4.1",
            name: "Technology and Legal Risk Mapping",
            description: "Approaches for mapping AI technology and legal risks of its components – including the use of third-party data or software – are in place, followed, and documented.",
            aisvsMapping: ["C1", "C6", "C10"]
          },
          {
            id: "map.4.2",
            code: "MAP.4.2",
            name: "Internal Risk Controls",
            description: "Internal risk controls for components of the AI system, including third-party AI technologies, are identified and documented.",
            aisvsMapping: ["C2", "C4", "C6", "C10"]
          }
        ]
      },
      {
        id: "map.5",
        code: "MAP.5",
        name: "Impact Characterization",
        description: "Impacts to individuals, groups, communities, organizations, and society are characterized.",
        subcategories: [
          {
            id: "map.5.1",
            code: "MAP.5.1",
            name: "Impact Likelihood and Magnitude",
            description: "Likelihood and magnitude of each identified impact (both potentially beneficial and harmful) based on expected use, past uses of AI systems in similar contexts, public incident reports, feedback from those external to the team that developed or deployed the AI system, or other data are identified and documented.",
            aisvsMapping: ["C1", "C11", "C12"]
          },
          {
            id: "map.5.2",
            code: "MAP.5.2",
            name: "Stakeholder Engagement Practices",
            description: "Practices and personnel for supporting regular engagement with relevant AI actors and integrating feedback about positive, negative, and unanticipated impacts are in place and documented.",
            aisvsMapping: ["C11", "C12", "C13"]
          }
        ]
      }
    ]
  },
  {
    id: "measure",
    code: "MEASURE",
    name: "Measure",
    description: "Identified AI risks are analyzed, assessed, and prioritized.",
    color: "#f59e0b",
    icon: "target",
    categories: [
      {
        id: "measure.1",
        code: "MEASURE.1",
        name: "Methods and Metrics",
        description: "Appropriate methods and metrics are identified and applied.",
        subcategories: [
          {
            id: "measure.1.1",
            code: "MEASURE.1.1",
            name: "Risk Measurement Approaches",
            description: "Approaches and metrics for measurement of AI risks enumerated during the MAP function are selected for implementation starting with the most significant AI risks.",
            aisvsMapping: ["C3", "C10", "C12"]
          },
          {
            id: "measure.1.2",
            code: "MEASURE.1.2",
            name: "Metrics Assessment and Updates",
            description: "Appropriateness of AI metrics and effectiveness of existing controls are regularly assessed and updated, including reports of errors and potential impacts on affected communities.",
            aisvsMapping: ["C10", "C11", "C12"]
          },
          {
            id: "measure.1.3",
            code: "MEASURE.1.3",
            name: "Independent Assessment",
            description: "Internal experts who did not serve as front-line developers for the system and/or independent assessors are involved in regular assessments and updates.",
            aisvsMapping: ["C10", "C12", "C13"]
          }
        ]
      },
      {
        id: "measure.2",
        code: "MEASURE.2",
        name: "Trustworthy Characteristics Evaluation",
        description: "AI systems are evaluated for trustworthy characteristics.",
        subcategories: [
          {
            id: "measure.2.1",
            code: "MEASURE.2.1",
            name: "TEVV Documentation",
            description: "Test sets, metrics, and details about the tools used during TEVV are documented.",
            aisvsMapping: ["C10", "C12"]
          },
          {
            id: "measure.2.2",
            code: "MEASURE.2.2",
            name: "Human Subject Evaluations",
            description: "Evaluations involving human subjects meet applicable requirements (including human subject protection) and are representative of the relevant population.",
            aisvsMapping: ["C11", "C13"]
          },
          {
            id: "measure.2.3",
            code: "MEASURE.2.3",
            name: "Performance Criteria Measurement",
            description: "AI system performance or assurance criteria are measured qualitatively or quantitatively and demonstrated for conditions similar to deployment setting(s).",
            aisvsMapping: ["C3", "C10", "C12"]
          },
          {
            id: "measure.2.4",
            code: "MEASURE.2.4",
            name: "Production Monitoring",
            description: "The functionality and behavior of the AI system and its components – as identified in the MAP function – are monitored when in production.",
            aisvsMapping: ["C12", "C13"]
          },
          {
            id: "measure.2.5",
            code: "MEASURE.2.5",
            name: "Validity and Reliability Demonstration",
            description: "The AI system to be deployed is demonstrated to be valid and reliable. Limitations of the generalizability beyond the conditions under which the technology was developed are documented.",
            aisvsMapping: ["C1", "C10", "C11"]
          },
          {
            id: "measure.2.6",
            code: "MEASURE.2.6",
            name: "Safety Risk Evaluation",
            description: "The AI system is evaluated regularly for safety risks – as identified in the MAP function. The AI system to be deployed is demonstrated to be safe, its residual negative risk does not exceed the risk tolerance, and it can fail safely.",
            aisvsMapping: ["C1", "C3", "C12"]
          },
          {
            id: "measure.2.7",
            code: "MEASURE.2.7",
            name: "Security and Resilience Evaluation",
            description: "AI system security and resilience – as identified in the MAP function – are evaluated and documented.",
            aisvsMapping: ["C2", "C4", "C8", "C9", "C10"]
          },
          {
            id: "measure.2.8",
            code: "MEASURE.2.8",
            name: "Transparency and Accountability Assessment",
            description: "Risks associated with transparency and accountability – as identified in the MAP function – are examined and documented.",
            aisvsMapping: ["C11", "C13"]
          },
          {
            id: "measure.2.9",
            code: "MEASURE.2.9",
            name: "Model Explanation and Interpretation",
            description: "The AI model is explained, validated, and documented, and AI system output is interpreted within its context – as identified in the MAP function – to inform responsible use and governance.",
            aisvsMapping: ["C7", "C11", "C13"]
          },
          {
            id: "measure.2.10",
            code: "MEASURE.2.10",
            name: "Privacy Risk Examination",
            description: "Privacy risk of the AI system – as identified in the MAP function – is examined and documented.",
            aisvsMapping: ["C1", "C11"]
          },
          {
            id: "measure.2.11",
            code: "MEASURE.2.11",
            name: "Fairness and Bias Evaluation",
            description: "Fairness and bias – as identified in the MAP function – are evaluated and results are documented.",
            aisvsMapping: ["C1", "C11"]
          },
          {
            id: "measure.2.12",
            code: "MEASURE.2.12",
            name: "Environmental Impact Assessment",
            description: "Environmental impact and sustainability of AI model training and management activities – as identified in the MAP function – are assessed and documented.",
            aisvsMapping: ["C1", "C3"]
          },
          {
            id: "measure.2.13",
            code: "MEASURE.2.13",
            name: "TEVV Effectiveness Evaluation",
            description: "Effectiveness of the employed TEVV metrics and processes in the MEASURE function are evaluated and documented.",
            aisvsMapping: ["C10", "C12"]
          }
        ]
      },
      {
        id: "measure.3",
        code: "MEASURE.3",
        name: "Risk Tracking Mechanisms",
        description: "Mechanisms for tracking identified AI risks over time are in place.",
        subcategories: [
          {
            id: "measure.3.1",
            code: "MEASURE.3.1",
            name: "Risk Identification and Tracking",
            description: "Approaches, personnel, and documentation are in place to regularly identify and track existing, unanticipated, and emergent AI risks based on factors such as intended and actual performance in deployed contexts.",
            aisvsMapping: ["C3", "C10", "C12"]
          },
          {
            id: "measure.3.2",
            code: "MEASURE.3.2",
            name: "Difficult-to-Assess Risk Tracking",
            description: "Risk tracking approaches are considered for settings where AI risks are difficult to assess using currently available measurement techniques or where metrics are not yet available.",
            aisvsMapping: ["C3", "C10", "C12"]
          },
          {
            id: "measure.3.3",
            code: "MEASURE.3.3",
            name: "User Feedback Processes",
            description: "Feedback processes for end users and impacted communities to report problems and appeal system outcomes are established and integrated into AI system evaluation metrics.",
            aisvsMapping: ["C11", "C12", "C13"]
          }
        ]
      },
      {
        id: "measure.4",
        code: "MEASURE.4",
        name: "Measurement Efficacy Feedback",
        description: "Feedback about efficacy of measurement is gathered and assessed.",
        subcategories: [
          {
            id: "measure.4.1",
            code: "MEASURE.4.1",
            name: "Context-Connected Measurement",
            description: "Measurement approaches for identifying AI risks are connected to deployment context(s) and informed through consultation with domain experts and other end users.",
            aisvsMapping: ["C3", "C10", "C11", "C12"]
          },
          {
            id: "measure.4.2",
            code: "MEASURE.4.2",
            name: "Trustworthiness Measurement Results",
            description: "Measurement results regarding AI system trustworthiness in deployment context(s) and across the AI lifecycle are informed by input from domain experts and relevant AI actors to validate whether the system is performing consistently as intended.",
            aisvsMapping: ["C10", "C11", "C12", "C13"]
          },
          {
            id: "measure.4.3",
            code: "MEASURE.4.3",
            name: "Performance Improvement Measurement",
            description: "Measurable performance improvements or declines based on consultations with relevant AI actors, including affected communities, and field data about context-relevant risks and trustworthiness characteristics are identified and documented.",
            aisvsMapping: ["C10", "C11", "C12"]
          }
        ]
      }
    ]
  },
  {
    id: "manage",
    code: "MANAGE",
    name: "Manage",
    description: "Identified AI risks are prioritized and managed according to organizational risk tolerance.",
    color: "#ef4444",
    icon: "layers",
    categories: [
      {
        id: "manage.1",
        code: "MANAGE.1",
        name: "Risk Prioritization and Response",
        description: "AI risks based on assessments and other analytical output from the MAP and MEASURE functions are prioritized, responded to, and managed.",
        subcategories: [
          {
            id: "manage.1.1",
            code: "MANAGE.1.1",
            name: "Purpose Achievement Determination",
            description: "A determination is made as to whether the AI system achieves its intended purposes and stated objectives and whether its development or deployment should proceed.",
            aisvsMapping: ["C1", "C3", "C12"]
          },
          {
            id: "manage.1.2",
            code: "MANAGE.1.2",
            name: "Risk Treatment Prioritization",
            description: "Treatment of documented AI risks is prioritized based on impact, likelihood, and available resources or methods.",
            aisvsMapping: ["C3", "C12"]
          },
          {
            id: "manage.1.3",
            code: "MANAGE.1.3",
            name: "High-Priority Risk Response",
            description: "Responses to the AI risks deemed high priority, as identified by the MAP function, are developed, planned, and documented. Risk response options can include mitigating, transferring, avoiding, or accepting.",
            aisvsMapping: ["C1", "C2", "C3", "C4", "C5"]
          },
          {
            id: "manage.1.4",
            code: "MANAGE.1.4",
            name: "Residual Risk Documentation",
            description: "Negative residual risks (defined as the sum of all unmitigated risks) to both downstream acquirers of AI systems and end users are documented.",
            aisvsMapping: ["C1", "C3", "C12"]
          }
        ]
      },
      {
        id: "manage.2",
        code: "MANAGE.2",
        name: "Benefit Maximization Strategies",
        description: "Strategies to maximize AI benefits and minimize negative impacts are planned, prepared, implemented, documented, and informed by input from relevant AI actors.",
        subcategories: [
          {
            id: "manage.2.1",
            code: "MANAGE.2.1",
            name: "Resource and Alternative Assessment",
            description: "Resources required to manage AI risks are taken into account – along with viable non-AI alternative systems, approaches, or methods – to reduce the magnitude or likelihood of potential impacts.",
            aisvsMapping: ["C3", "C5", "C12"]
          },
          {
            id: "manage.2.2",
            code: "MANAGE.2.2",
            name: "Value Sustainment Mechanisms",
            description: "Mechanisms are in place and applied to sustain the value of deployed AI systems.",
            aisvsMapping: ["C3", "C12", "C13"]
          },
          {
            id: "manage.2.3",
            code: "MANAGE.2.3",
            name: "Unknown Risk Response",
            description: "Procedures are followed to respond to and recover from a previously unknown risk when it is identified.",
            aisvsMapping: ["C12", "C13"]
          },
          {
            id: "manage.2.4",
            code: "MANAGE.2.4",
            name: "System Override Mechanisms",
            description: "Mechanisms are in place and applied, and responsibilities are assigned and understood, to supersede, disengage, or deactivate AI systems that demonstrate performance or outcomes inconsistent with intended use.",
            aisvsMapping: ["C7", "C12", "C13"]
          }
        ]
      },
      {
        id: "manage.3",
        code: "MANAGE.3",
        name: "Third-Party Risk Management",
        description: "AI risks and benefits from third-party entities are managed.",
        subcategories: [
          {
            id: "manage.3.1",
            code: "MANAGE.3.1",
            name: "Third-Party Resource Monitoring",
            description: "AI risks and benefits from third-party resources are regularly monitored, and risk controls are applied and documented.",
            aisvsMapping: ["C6", "C12"]
          },
          {
            id: "manage.3.2",
            code: "MANAGE.3.2",
            name: "Pre-trained Model Monitoring",
            description: "Pre-trained models which are used for development are monitored as part of AI system regular monitoring and maintenance.",
            aisvsMapping: ["C6", "C12"]
          }
        ]
      },
      {
        id: "manage.4",
        code: "MANAGE.4",
        name: "Risk Treatment and Communication",
        description: "Risk treatments, including response and recovery, and communication plans for the identified and measured AI risks are documented and monitored regularly.",
        subcategories: [
          {
            id: "manage.4.1",
            code: "MANAGE.4.1",
            name: "Post-Deployment Monitoring",
            description: "Post-deployment AI system monitoring plans are implemented, including mechanisms for capturing and evaluating input from users and other relevant AI actors, appeal and override, decommissioning, incident response, recovery, and change management.",
            aisvsMapping: ["C12", "C13"]
          },
          {
            id: "manage.4.2",
            code: "MANAGE.4.2",
            name: "Continual Improvement Activities",
            description: "Measurable activities for continual improvements are integrated into AI system updates and include regular engagement with interested parties, including relevant AI actors.",
            aisvsMapping: ["C11", "C12", "C13"]
          },
          {
            id: "manage.4.3",
            code: "MANAGE.4.3",
            name: "Incident and Error Communication",
            description: "Incidents and errors are communicated to relevant AI actors, including affected communities. Processes for tracking, responding to, and recovering from incidents and errors are followed and documented.",
            aisvsMapping: ["C12", "C13"]
          }
        ]
      }
    ]
  }
];

export const NISTMapping = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [selectedAISVS, setSelectedAISVS] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // D3 Graph State
  const svgRef = useRef<SVGSVGElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Convert AISVS data for easier access
  const aisvsCategories = Object.values(aisvsData);

  // Reset graph state on component mount
  useEffect(() => {
    // Reset graph state when component mounts
    setExpandedNodes(new Set());
    setSelectedNode(null);
    setSelectedNodeData(null);
    setFocusMode(false);
  }, []); // Empty dependency array means this runs only on mount

  // Handle URL hash-based navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['overview', 'framework-overview', 'mapping', 'detailed-mapping', 'matrix', 'compliance-matrix', 'integration-matrix', 'graph', 'interactive-graph'];
    
    if (hash && validTabs.includes(hash)) {
      // Map hash aliases to actual tab values
      const tabMapping: { [key: string]: string } = {
        'framework-overview': 'overview',
        'detailed-mapping': 'mapping',
        'compliance-matrix': 'matrix',
        'integration-matrix': 'matrix',
        'interactive-graph': 'graph'
      };
      
      const mappedTab = tabMapping[hash] || hash;
      if (['overview', 'mapping', 'matrix', 'graph'].includes(mappedTab)) {
        setActiveTab(mappedTab);
      }
    } else if (!hash) {
      setActiveTab('overview');
    }
  }, [location.hash]);

  // Handle tab changes and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Map tab values to hash aliases for better URLs
    const hashMapping: { [key: string]: string } = {
      'overview': 'framework-overview',
      'mapping': 'detailed-mapping', 
      'matrix': 'integration-matrix',
      'graph': 'interactive-graph'
    };
    
    const hash = hashMapping[value] || value;
    navigate(`${location.pathname}#${hash}`, { replace: true });
  };

  // Filter NIST functions based on search and filters
  const filteredNISTFunctions = useMemo(() => {
    return nistAIRMF.filter(func => {
      const matchesSearch = searchTerm === "" ||
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.categories.some(cat =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.subcategories.some(sub =>
            sub.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

      const matchesFunction = selectedFunction === "all" || func.id === selectedFunction;

      const matchesAISVS = selectedAISVS === "all" ||
        func.categories.some(cat =>
          cat.subcategories.some(sub =>
            sub.aisvsMapping.includes(selectedAISVS)
          )
        );

      return matchesSearch && matchesFunction && matchesAISVS;
    });
  }, [searchTerm, selectedFunction, selectedAISVS]);

  // Get AISVS category info
  const getAISVSCategory = (code: string) => {
    return aisvsCategories.find(cat => cat.code === code);
  };

  // Calculate mapping statistics
  const mappingStats = useMemo(() => {
    const totalNISTSubcategories = nistAIRMF.reduce((total, func) =>
      total + func.categories.reduce((catTotal, cat) => catTotal + cat.subcategories.length, 0), 0
    );

    const mappedSubcategories = nistAIRMF.reduce((total, func) =>
      total + func.categories.reduce((catTotal, cat) =>
        catTotal + cat.subcategories.filter(sub => sub.aisvsMapping.length > 0).length, 0
      ), 0
    );

    const aisvsWithMappings = aisvsCategories.filter(cat =>
      nistAIRMF.some(func =>
        func.categories.some(nistCat =>
          nistCat.subcategories.some(sub =>
            sub.aisvsMapping.includes(cat.code)
          )
        )
      )
    ).length;

    return {
      totalNISTSubcategories,
      mappedSubcategories,
      aisvsWithMappings,
      coveragePercentage: Math.round((mappedSubcategories / totalNISTSubcategories) * 100)
    };
  }, [aisvsCategories]);

  // D3 Graph Data Structure
  const graphData = useMemo(() => {
    interface GraphNode {
      id: string;
      type: 'nist-function' | 'nist-category' | 'nist-subcategory' | 'aisvs-category';
      label: string;
      description?: string;
      color: string;
      parentId?: string;
      x?: number;
      y?: number;
      fx?: number | null;
      fy?: number | null;
      expanded?: boolean;
      visible?: boolean;
      data?: any;
    }

    interface GraphLink {
      source: string;
      target: string;
      type: 'hierarchy' | 'mapping';
      visible?: boolean;
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add NIST Function nodes
    nistAIRMF.forEach((func, funcIndex) => {
      nodes.push({
        id: func.id,
        type: 'nist-function',
        label: func.code,
        description: func.name,
        color: func.color,
        x: 200,
        y: 150 + funcIndex * 150,
        expanded: expandedNodes.has(func.id),
        visible: true,
        data: func
      });

      // Add categories and subcategories if function is expanded
      if (expandedNodes.has(func.id)) {
        func.categories.forEach((category, catIndex) => {
          const categoryId = `${func.id}-${category.id}`;
          nodes.push({
            id: categoryId,
            type: 'nist-category',
            label: category.code,
            description: category.name,
            color: func.color,
            parentId: func.id,
            x: 400,
            y: 100 + funcIndex * 150 + catIndex * 60,
            expanded: expandedNodes.has(categoryId),
            visible: true,
            data: category
          });

          // Hierarchy link from function to category
          links.push({
            source: func.id,
            target: categoryId,
            type: 'hierarchy',
            visible: true
          });

          // Add subcategories if category is expanded
          if (expandedNodes.has(categoryId)) {
            category.subcategories.forEach((subcategory, subIndex) => {
              const subcategoryId = `${categoryId}-${subcategory.id}`;
              nodes.push({
                id: subcategoryId,
                type: 'nist-subcategory',
                label: subcategory.code,
                description: subcategory.name,
                color: func.color,
                parentId: categoryId,
                x: 600,
                y: 80 + funcIndex * 150 + catIndex * 60 + subIndex * 30,
                visible: true,
                data: subcategory
              });

              // Hierarchy link from category to subcategory
              links.push({
                source: categoryId,
                target: subcategoryId,
                type: 'hierarchy',
                visible: true
              });

              // Add mapping links to AISVS categories
              subcategory.aisvsMapping.forEach(aisvsCode => {
                const aisvsId = `aisvs-${aisvsCode}`;
                
                // Ensure AISVS node exists
                if (!nodes.find(n => n.id === aisvsId)) {
                  const aisvsCategory = getAISVSCategory(aisvsCode);
                  if (aisvsCategory) {
                    const aisvsIndex = aisvsCategories.findIndex(cat => cat.code === aisvsCode);
                    nodes.push({
                      id: aisvsId,
                      type: 'aisvs-category',
                      label: aisvsCategory.code,
                      description: aisvsCategory.name,
                      color: aisvsCategory.color,
                      x: 900,
                      y: 100 + aisvsIndex * 45,
                      visible: true,
                      data: aisvsCategory
                    });
                  }
                }

                // Add mapping link
                links.push({
                  source: subcategoryId,
                  target: aisvsId,
                  type: 'mapping',
                  visible: true
                });
              });
            });
          }
        });
      }
    });

    // Add standalone AISVS nodes for those not yet connected
    aisvsCategories.forEach((category, index) => {
      const aisvsId = `aisvs-${category.code}`;
      if (!nodes.find(n => n.id === aisvsId)) {
        nodes.push({
          id: aisvsId,
          type: 'aisvs-category',
          label: category.code,
          description: category.name,
          color: category.color,
          x: 900,
          y: 100 + index * 45,
          visible: true,
          data: category
        });
      }
    });

    // Apply focus mode filtering
    if (focusMode && selectedNode) {
      // Get all nodes and links related to the selected node
      const relatedNodeIds = new Set<string>();
      const relatedLinkIds = new Set<string>();
      
      // Add the selected node itself
      relatedNodeIds.add(selectedNode);
      
      // Find all links connected to the selected node
      links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
        
        if (sourceId === selectedNode || targetId === selectedNode) {
          relatedLinkIds.add(`${sourceId}-${targetId}`);
          relatedNodeIds.add(sourceId);
          relatedNodeIds.add(targetId);
        }
      });
      
      // If selected node is AISVS, also include parent hierarchy for connected NIST nodes
      if (selectedNode.startsWith('aisvs-')) {
        links.forEach(link => {
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
          if (targetId === selectedNode && link.type === 'mapping') {
            const nistSubcategoryId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
            relatedNodeIds.add(nistSubcategoryId);
            
            // Find parent category and function
            const subcategoryNode = nodes.find(n => n.id === nistSubcategoryId);
            if (subcategoryNode?.parentId) {
              relatedNodeIds.add(subcategoryNode.parentId);
              
              // Add hierarchy links
              relatedLinkIds.add(`${subcategoryNode.parentId}-${nistSubcategoryId}`);
              
              const categoryNode = nodes.find(n => n.id === subcategoryNode.parentId);
              if (categoryNode?.parentId) {
                relatedNodeIds.add(categoryNode.parentId);
                relatedLinkIds.add(`${categoryNode.parentId}-${subcategoryNode.parentId}`);
              }
            }
          }
        });
      }
      
      // If selected node is NIST, include its hierarchy
      if (!selectedNode.startsWith('aisvs-')) {
        // Find children in hierarchy
                  const findChildren = (nodeId: string) => {
            links.forEach(link => {
              const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
              if (sourceId === nodeId && link.type === 'hierarchy') {
                const childId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
                relatedNodeIds.add(childId);
                relatedLinkIds.add(`${nodeId}-${childId}`);
                findChildren(childId); // Recursively find children
              }
            });
          };
        
        // Find parents in hierarchy
        const findParents = (nodeId: string) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node?.parentId) {
            relatedNodeIds.add(node.parentId);
            relatedLinkIds.add(`${node.parentId}-${nodeId}`);
            findParents(node.parentId);
          }
        };
        
        findChildren(selectedNode);
        findParents(selectedNode);
      }
      
      // Update node visibility
      nodes.forEach(node => {
        node.visible = relatedNodeIds.has(node.id);
      });
      
      // Update link visibility
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
        const linkId = `${sourceId}-${targetId}`;
        
        // Show link only if both nodes are visible and link is in related set
        link.visible = relatedNodeIds.has(sourceId) && relatedNodeIds.has(targetId) && 
                     (relatedLinkIds.has(linkId) || relatedLinkIds.has(`${targetId}-${sourceId}`));
      });
    } else {
      // Normal mode - show all visible nodes and links
      nodes.forEach(node => {
        if (node.visible === undefined) node.visible = true;
      });
      links.forEach(link => {
        if (link.visible === undefined) link.visible = true;
      });
    }

    return { nodes, links };
  }, [expandedNodes, aisvsCategories, getAISVSCategory, focusMode, selectedNode]);

  // D3 Graph Rendering Effect
  useEffect(() => {
    if (!svgRef.current || activeTab !== 'graph') return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 800;

    // Clear previous content
    svg.selectAll("*").remove();

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create main container
    const container = svg.append("g");

    // Add background grid
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.1);

    container.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid)");

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance((d: any) => d.type === 'hierarchy' ? 100 : 200)
        .strength((d: any) => d.type === 'hierarchy' ? 0.8 : 0.3)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(graphData.links.filter(l => l.visible))
      .enter().append("line")
      .attr("stroke", (d: any) => d.type === 'hierarchy' ? "#666" : "#999")
      .attr("stroke-width", (d: any) => d.type === 'hierarchy' ? 2 : 1)
      .attr("stroke-dasharray", (d: any) => d.type === 'mapping' ? "5,5" : "none")
      .attr("opacity", 0.6);

    // Create node groups
    const node = container.append("g")
      .selectAll("g")
      .data(graphData.nodes.filter(n => n.visible))
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add node shapes based on type
    node.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      if (d.type === 'nist-function') {
        // Large circles for NIST functions
        nodeGroup.append("circle")
          .attr("r", 40)
          .attr("fill", d.color)
          .attr("opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 3);
          
        // Plus/minus indicator for expansion
        const indicator = nodeGroup.append("circle")
          .attr("r", 8)
          .attr("cx", 28)
          .attr("cy", -28)
          .attr("fill", "white")
          .attr("stroke", d.color)
          .attr("stroke-width", 2);
          
        nodeGroup.append("text")
          .attr("x", 28)
          .attr("y", -24)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", d.color)
          .text(d.expanded ? "−" : "+");
          
      } else if (d.type === 'nist-category') {
        // Rounded rectangles for categories
        nodeGroup.append("rect")
          .attr("x", -40)
          .attr("y", -15)
          .attr("width", 80)
          .attr("height", 30)
          .attr("rx", 15)
          .attr("fill", d.color)
          .attr("opacity", 0.7)
          .attr("stroke", "white")
          .attr("stroke-width", 2);
          
        // Plus/minus indicator for expansion
        nodeGroup.append("circle")
          .attr("r", 6)
          .attr("cx", 30)
          .attr("cy", -10)
          .attr("fill", "white")
          .attr("stroke", d.color)
          .attr("stroke-width", 2);
          
        nodeGroup.append("text")
          .attr("x", 30)
          .attr("y", -6)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("fill", d.color)
          .text(d.expanded ? "−" : "+");
          
      } else if (d.type === 'nist-subcategory') {
        // Small rectangles for subcategories
        nodeGroup.append("rect")
          .attr("x", -30)
          .attr("y", -10)
          .attr("width", 60)
          .attr("height", 20)
          .attr("rx", 10)
          .attr("fill", d.color)
          .attr("opacity", 0.6)
          .attr("stroke", "white")
          .attr("stroke-width", 1);
          
      } else if (d.type === 'aisvs-category') {
        // Rounded rectangles for AISVS categories
        nodeGroup.append("rect")
          .attr("x", -50)
          .attr("y", -12)
          .attr("width", 100)
          .attr("height", 24)
          .attr("rx", 12)
          .attr("fill", d.color)
          .attr("opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 2);
      }
      
      // Add labels
      nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", d.type === 'nist-function' ? "0.35em" : "0.35em")
        .attr("font-size", d.type === 'nist-function' ? "12px" : "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(d.label);
        
      // Add description text below for functions
      if (d.type === 'nist-function') {
        nodeGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "50px")
          .attr("font-size", "10px")
          .attr("fill", () => {
            // Check if dark mode is active
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? '#e5e7eb' : '#374151'; // Light gray for dark mode, dark gray for light mode
          })
          .attr("opacity", 0.9)
          .text(d.description);
      }
    });

    // Add click handlers for expansion and reverse mapping
    node.on("click", (event, d: any) => {
      event.stopPropagation();
      
      // Check if this is the same node being clicked again
      const isSameNode = selectedNode === d.id;
      
      if (d.type === 'nist-function' || d.type === 'nist-category') {
        const newExpandedNodes = new Set(expandedNodes);
        if (expandedNodes.has(d.id)) {
          newExpandedNodes.delete(d.id);
          // Also collapse all children
          if (d.type === 'nist-function') {
            d.data.categories.forEach((cat: any) => {
              const catId = `${d.id}-${cat.id}`;
              newExpandedNodes.delete(catId);
            });
          }
        } else {
          newExpandedNodes.add(d.id);
        }
        setExpandedNodes(newExpandedNodes);
      } else if (d.type === 'aisvs-category') {
        // For AISVS categories, expand all NIST elements that map to this category
        const newExpandedNodes = new Set(expandedNodes);
        
        // Find all NIST subcategories that map to this AISVS category
        nistAIRMF.forEach(func => {
          func.categories.forEach(cat => {
            cat.subcategories.forEach(sub => {
              if (sub.aisvsMapping.includes(d.label)) {
                // Expand the function and category to show this subcategory
                newExpandedNodes.add(func.id);
                newExpandedNodes.add(`${func.id}-${cat.id}`);
              }
            });
          });
        });
        
        setExpandedNodes(newExpandedNodes);
      }
      
      // Toggle focus mode for AISVS categories and NIST subcategories
      if (d.type === 'aisvs-category' || d.type === 'nist-subcategory') {
        if (isSameNode && focusMode) {
          // If clicking the same node and already in focus mode, exit focus mode
          setFocusMode(false);
          setSelectedNode(null);
          setSelectedNodeData(null);
        } else {
          // Enter focus mode for this node
          setFocusMode(true);
          setSelectedNode(d.id);
          setSelectedNodeData(d);
        }
      } else {
        // For other node types, just select without focus mode
        setFocusMode(false);
        setSelectedNode(d.id);
        setSelectedNodeData(d);
      }
    });

    // Add hover effects
    node.on("mouseenter", function(event, d: any) {
      d3.select(this).select("circle, rect")
        .transition()
        .duration(200)
        .attr("opacity", 1);
        
      // Show tooltip
      const tooltip = container.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${d.x + 50}, ${d.y - 20})`);
        
      const rect = tooltip.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 200)
        .attr("height", 40)
        .attr("rx", 5)
        .attr("fill", () => {
          // Check if dark mode is active
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? '#111827' : '#000000'; // Very dark gray for dark mode, black for light mode
        })
        .attr("opacity", 0.9)
        .attr("stroke", () => {
          // Check if dark mode is active
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? '#374151' : '#ffffff'; // Border for better visibility
        })
        .attr("stroke-width", 1);
        
      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 15)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d.label);
        
      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(d.description?.substring(0, 30) + "...");
    })
    .on("mouseleave", function(event, d: any) {
      d3.select(this).select("circle, rect")
        .transition()
        .duration(200)
        .attr("opacity", d.type === 'nist-function' ? 0.8 : 
               d.type === 'aisvs-category' ? 0.8 : 
               d.type === 'nist-category' ? 0.7 : 0.6);
               
      container.selectAll(".tooltip").remove();
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add legend
    const legend = container.append("g")
      .attr("transform", "translate(50, 650)");
      
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 300)
      .attr("height", 120)
      .attr("rx", 8)
      .attr("fill", () => {
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? '#1f2937' : '#ffffff'; // Dark gray for dark mode, white for light mode
      })
      .attr("opacity", 0.95)
      .attr("stroke", () => {
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? '#374151' : '#d1d5db'; // Darker border for dark mode, light border for light mode
      })
      .attr("stroke-width", 1);
      
    legend.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", () => {
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? '#e5e7eb' : '#374151'; // Light gray for dark mode, dark gray for light mode
      })
      .text("Interactive Legend");
      
    // Legend items
    const legendItems = [
      { type: "circle", r: 8, fill: "#3b82f6", text: "NIST Functions (Click to expand)" },
      { type: "rect", width: 16, height: 8, fill: "#3b82f6", text: "NIST Categories/Subcategories" },
      { type: "rect", width: 20, height: 10, fill: "#10b981", text: "AISVS Categories" },
      { type: "line", stroke: "#999", text: "Mapping Connections" }
    ];
    
    legendItems.forEach((item, i) => {
      const y = 40 + i * 20;
      
      if (item.type === "circle") {
        legend.append("circle")
          .attr("cx", 20)
          .attr("cy", y)
          .attr("r", item.r)
          .attr("fill", item.fill)
          .attr("opacity", 0.8);
      } else if (item.type === "rect") {
        legend.append("rect")
          .attr("x", 20 - item.width! / 2)
          .attr("y", y - item.height! / 2)
          .attr("width", item.width)
          .attr("height", item.height)
          .attr("rx", 4)
          .attr("fill", item.fill)
          .attr("opacity", 0.8);
      } else if (item.type === "line") {
        legend.append("line")
          .attr("x1", 10)
          .attr("y1", y)
          .attr("x2", 30)
          .attr("y2", y)
          .attr("stroke", item.stroke)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "3,3");
      }
      
      legend.append("text")
        .attr("x", 40)
        .attr("y", y + 4)
        .attr("font-size", "11px")
        .attr("fill", () => {
          // Check if dark mode is active
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? '#e5e7eb' : '#374151'; // Light gray for dark mode, dark gray for light mode
        })
        .text(item.text);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
    
  }, [activeTab, graphData, expandedNodes]);

  return (
    <>
      <Helmet>
        <title>NIST AI RMF to AISVS Mapping | Agentic Security Hub</title>
        <meta name="description" content="Comprehensive visual mapping between NIST AI Risk Management Framework (AI RMF) and OWASP AISVS categories, showing alignment and complementary coverage." />
        <meta name="keywords" content="NIST AI RMF, OWASP AISVS, AI risk management, AI security framework, AI governance, compliance mapping" />
        <link rel="canonical" href="https://agenticsecurity.info/#/nist-mapping" />

        {/* Open Graph */}
        <meta property="og:title" content="NIST AI RMF to AISVS Mapping" />
        <meta property="og:description" content="Visual mapping between NIST AI Risk Management Framework and OWASP AISVS categories." />
        <meta property="og:url" content="https://agenticsecurity.info/#/nist-mapping" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NIST AI RMF to AISVS Mapping" />
        <meta name="twitter:description" content="Visual mapping between NIST AI Risk Management Framework and OWASP AISVS categories." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <SidebarNav type="controls" isOpen={false} onClose={() => {}} />

        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GitBranch className="h-8 w-8 text-primary" />
              </div>
              <div>
                            <h1 className="text-3xl font-bold">NIST AI RMF to AISVS Mapping</h1>
            <p className="text-lg text-muted-foreground">Framework Alignment & Compliance Coverage</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
              Explore the comprehensive mapping between NIST AI Risk Management Framework (AI RMF) 
              and OWASP AI Security Verification Standard (AISVS). This visual guide helps organizations 
              understand how these frameworks complement each other for comprehensive AI governance and security.
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">NIST Functions</p>
                      <p className="text-xl font-bold">{nistAIRMF.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">NIST Subcategories</p>
                      <p className="text-xl font-bold">{mappingStats.totalNISTSubcategories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">AISVS Categories</p>
                      <p className="text-xl font-bold">{aisvsCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link 
                    to="/nist-mapping#framework-overview" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('overview')}
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Framework Overview</span>
                  </Link>
                  <Link 
                    to="/nist-mapping#detailed-mapping" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('mapping')}
                  >
                    <GitBranch className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Detailed Mapping</span>
                  </Link>
                  <Link 
                    to="/nist-mapping#integration-matrix" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('matrix')}
                  >
                    <Network className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Integration Matrix</span>
                  </Link>
                  <Link 
                    to="/nist-mapping#interactive-graph" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('graph')}
                  >
                    <Layers className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Interactive Graph</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Filters */}
          <Card className="mb-8 border-border/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-primary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Search className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-base font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    Search & Filter Mappings
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Find specific NIST functions and their AISVS mappings
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search NIST functions, categories, or subcategories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border/50 focus:border-primary/50 bg-background/50 focus:bg-background transition-all duration-200"
                  />
                </div>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="border-border/50 focus:border-primary/50 bg-background/50 focus:bg-background transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <SelectValue placeholder="All NIST Functions" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-background border border-border shadow-lg">
                    <SelectItem value="all">All NIST Functions</SelectItem>
                    {nistAIRMF.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: func.color }}></div>
                          {func.code} - {func.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAISVS} onValueChange={setSelectedAISVS}>
                  <SelectTrigger className="border-border/50 focus:border-primary/50 bg-background/50 focus:bg-background transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <SelectValue placeholder="All AISVS Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-background border border-border shadow-lg">
                    <SelectItem value="all">All AISVS Categories</SelectItem>
                    {aisvsCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.code}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          {cat.code} - {cat.name.split(' &')[0]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl border border-border/50">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Framework Overview</span>
                  <span className="sm:hidden">Overview</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="mapping" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Detailed Mapping</span>
                  <span className="sm:hidden">Mapping</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="matrix" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Compliance Matrix</span>
                  <span className="sm:hidden">Matrix</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="graph" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Interactive Graph</span>
                  <span className="sm:hidden">Graph</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Framework Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* NIST AI RMF Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      NIST AI Risk Management Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      A comprehensive framework for managing AI risks across the entire AI lifecycle, 
                      organized into four core functions that provide a structured approach to AI governance.
                    </p>
                    <div className="space-y-3">
                      {nistAIRMF.map((func) => (
                        <div key={func.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: func.color }}></div>
                            <h4 className="font-semibold">{func.code}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{func.description}</p>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {func.categories.length} categories
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AISVS Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      OWASP AI Security Verification Standard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      A comprehensive set of security requirements and controls specifically designed 
                      for AI systems, providing detailed technical guidance for secure AI implementation.
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {aisvsCategories.map((cat) => (
                        <div key={cat.id} className="p-2 border rounded text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="font-medium">{cat.code}</span>
                            <span className="text-muted-foreground">{cat.name.split(' &')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Mapping Tab */}
            <TabsContent value="mapping" className="mt-6">
              <div className="space-y-6">
                {filteredNISTFunctions.map((func) => (
                  <Card key={func.id} className="overflow-hidden">
                    <CardHeader className="pb-4" style={{ backgroundColor: `${func.color}10` }}>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${func.color}20` }}>
                          <Shield className="h-6 w-6" style={{ color: func.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: func.color }}>
                            {func.code}: {func.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {func.description}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Accordion type="multiple" className="w-full">
                        {func.categories.map((category) => (
                          <AccordionItem key={category.id} value={category.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <Badge variant="outline">{category.code}</Badge>
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {category.subcategories.length} subcategories
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {category.subcategories.map((subcategory) => (
                                  <div key={subcategory.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-sm mb-1">
                                          {subcategory.code}: {subcategory.name}
                                        </h5>
                                        <p className="text-muted-foreground text-sm">
                                          {subcategory.description}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* AISVS Mappings */}
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="flex items-center gap-2 mb-2">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Maps to AISVS:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {subcategory.aisvsMapping.length > 0 ? (
                                          subcategory.aisvsMapping.map((aisvsCode) => {
                                            const aisvsCategory = getAISVSCategory(aisvsCode);
                                            return aisvsCategory ? (
                                              <Link key={aisvsCode} to="/aisvs">
                                                <Badge 
                                                  variant="default" 
                                                  className="text-xs hover:opacity-80 transition-opacity cursor-pointer"
                                                  style={{ backgroundColor: aisvsCategory.color }}
                                                >
                                                  {aisvsCode}: {aisvsCategory.name.split(' &')[0]}
                                                </Badge>
                                              </Link>
                                            ) : (
                                              <Badge key={aisvsCode} variant="outline" className="text-xs">
                                                {aisvsCode}
                                              </Badge>
                                            );
                                          })
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            No direct AISVS mapping identified
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Compliance Matrix Tab */}
            <TabsContent value="matrix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Framework Compliance Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left font-medium">NIST AI RMF</th>
                          {aisvsCategories.slice(0, 10).map((cat) => (
                            <th key={cat.id} className="border p-2 text-center text-xs font-medium min-w-16">
                              <div className="transform -rotate-45 origin-center">
                                {cat.code}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {nistAIRMF.map((func) => (
                          func.categories.map((category) => (
                            category.subcategories.map((subcategory) => (
                              <tr key={subcategory.id}>
                                <td className="border p-2 text-sm">
                                  <div className="font-medium">{subcategory.code}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {subcategory.name}
                                  </div>
                                </td>
                                {aisvsCategories.slice(0, 10).map((cat) => (
                                  <td key={cat.id} className="border p-2 text-center">
                                    {subcategory.aisvsMapping.includes(cat.code) ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <div className="w-4 h-4 mx-auto"></div>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Matrix Legend</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Direct mapping exists</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-muted-foreground/20 rounded"></div>
                        <span>No direct mapping</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Graph Tab */}
            <TabsContent value="graph" className="mt-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Network className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Interactive D3.js Mapping Graph
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Advanced visualization with expandable nodes and intelligent focus modes
                      </p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Click nodes to expand</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Drag to rearrange</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Use focus mode for clarity</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-[800px] border border-border/50 rounded-xl bg-gradient-to-br from-background via-background/95 to-muted/30 overflow-hidden shadow-inner">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50"></div>
                    
                    <svg 
                      ref={svgRef}
                      width="100%" 
                      height="100%" 
                      className="absolute inset-0 z-10"
                    />
                    
                    {/* Modern Interactive Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
                      {/* Control Panel */}
                      <div className="bg-background/95 dark:bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg z-50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-xs font-semibold text-foreground">Graph Controls</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedNodes(new Set());
                              setSelectedNode(null);
                              setSelectedNodeData(null);
                              setFocusMode(false);
                            }}
                            className="text-xs h-8 bg-background hover:bg-accent border text-foreground hover:text-accent-foreground transition-all duration-200 cursor-pointer select-none"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset Graph
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newExpanded = new Set<string>();
                              nistAIRMF.forEach(func => {
                                newExpanded.add(func.id);
                                func.categories.forEach(cat => {
                                  newExpanded.add(`${func.id}-${cat.id}`);
                                });
                              });
                              setExpandedNodes(newExpanded);
                            }}
                            className="text-xs h-8 bg-background hover:bg-accent border text-foreground hover:text-accent-foreground transition-all duration-200 cursor-pointer select-none"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Maximize className="h-3 w-3 mr-1" />
                            Expand All
                          </Button>
                          
                          <Button
                            variant={focusMode ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFocusMode(!focusMode);
                              if (!focusMode && !selectedNode) {
                                return;
                              }
                            }}
                            disabled={!selectedNode}
                            className={`text-xs h-8 transition-all duration-200 cursor-pointer select-none ${
                              focusMode 
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' 
                                : 'bg-background hover:bg-accent border text-foreground hover:text-accent-foreground'
                            } ${!selectedNode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {focusMode ? "Exit Focus" : "Focus Mode"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Status Panel */}
                      <div className="bg-background/95 dark:bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg z-50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-semibold text-foreground">Graph Status</span>
                        </div>
                        
                        {focusMode && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <Target className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">Focus Mode Active</span>
                          </div>
                        )}
                        
                                                 <div className="space-y-2 text-xs">
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground">Expanded:</span>
                             <span className="font-medium text-foreground">{expandedNodes.size}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground">Visible:</span>
                             <span className="font-medium text-foreground">{graphData.nodes.filter(n => n.visible).length}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground">Links:</span>
                             <span className="font-medium text-foreground">{graphData.links.filter(l => l.visible).length}</span>
                           </div>
                         </div>
                         
                         {/* Quick Tips */}
                         <div className="mt-4 pt-3 border-t border-border/30">
                           <div className="text-xs text-muted-foreground space-y-1">
                             <div className="flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                               <span>Click nodes to expand/collapse</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-green-500"></div>
                               <span>Drag nodes to reposition</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                               <span>Select node for focus mode</span>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Node Information Panel */}
                  {selectedNodeData && (
                    <div className="mt-4">
                      {focusMode && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                            <Target className="h-4 w-4" />
                            <span className="font-medium text-sm">Focus Mode Active</span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Showing only "{selectedNodeData.label}" and its direct connections. 
                            Click the same node again or use "Exit Focus" to return to full view.
                          </p>
                        </div>
                      )}
                      <Card className="border-2" style={{ borderColor: selectedNodeData.color }}>
                        <CardHeader className="pb-3" style={{ backgroundColor: `${selectedNodeData.color}15` }}>
                          <CardTitle className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: selectedNodeData.color }}
                            >
                              {selectedNodeData.type === 'nist-function' && <Shield className="h-5 w-5" />}
                              {selectedNodeData.type === 'nist-category' && <Target className="h-4 w-4" />}
                              {selectedNodeData.type === 'nist-subcategory' && <CheckCircle className="h-4 w-4" />}
                              {selectedNodeData.type === 'aisvs-category' && <Network className="h-4 w-4" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold" style={{ color: selectedNodeData.color }}>
                                {selectedNodeData.label}: {selectedNodeData.description}
                              </h3>
                              <Badge variant="outline" className="mt-1">
                                {selectedNodeData.type === 'nist-function' && 'NIST AI RMF Function'}
                                {selectedNodeData.type === 'nist-category' && 'NIST AI RMF Category'}
                                {selectedNodeData.type === 'nist-subcategory' && 'NIST AI RMF Subcategory'}
                                {selectedNodeData.type === 'aisvs-category' && 'OWASP AISVS Category'}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Description and Details */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Description & Purpose
                              </h4>
                              
                                                             {selectedNodeData.type === 'nist-function' && (
                                 <div className="space-y-4">
                                   <p className="text-sm text-muted-foreground leading-relaxed">
                                     {selectedNodeData.data.description}
                                   </p>
                                   
                                   <div className="p-4 bg-muted/50 rounded-lg">
                                     <h5 className="font-medium text-sm mb-3">Key Responsibilities & Activities:</h5>
                                     <ul className="text-xs text-muted-foreground space-y-2">
                                       {selectedNodeData.id === 'govern' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Governance Structure:</strong> Establish AI governance boards, define roles and responsibilities, and create accountability frameworks</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Policy Development:</strong> Create comprehensive AI policies covering ethics, risk management, and compliance requirements</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Human-AI Alignment:</strong> Design meaningful human oversight mechanisms and decision-making processes</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Risk Appetite:</strong> Define organizational tolerance for AI risks and establish clear boundaries</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'map' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Context Analysis:</strong> Document AI system purpose, use cases, and operational environment thoroughly</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Risk Categorization:</strong> Classify AI systems by impact level (high, moderate, low) and risk profile</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Stakeholder Mapping:</strong> Identify all affected parties and document their concerns and requirements</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Threat Modeling:</strong> Systematically identify AI-specific threats, attack vectors, and vulnerability sources</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'measure' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Performance Metrics:</strong> Define and implement comprehensive KPIs for AI system performance and reliability</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Bias Testing:</strong> Conduct systematic fairness assessments across different demographic groups and use cases</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Security Assessment:</strong> Perform penetration testing, vulnerability scans, and adversarial attack simulations</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Risk Quantification:</strong> Use statistical methods to measure and prioritize identified AI risks</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'manage' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Risk Treatment:</strong> Implement mitigation strategies including avoidance, reduction, transfer, and acceptance</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Control Implementation:</strong> Deploy technical, administrative, and physical safeguards for AI systems</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Incident Response:</strong> Establish 24/7 monitoring, detection, and response capabilities for AI incidents</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Third-Party Management:</strong> Assess and monitor AI vendors, suppliers, and service providers</span>
                                           </li>
                                         </>
                                       )}
                                     </ul>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3">
                                     <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-blue-800 dark:text-blue-200">Implementation Timeline</h6>
                                       <p className="text-xs text-blue-700 dark:text-blue-300">
                                         {selectedNodeData.id === 'govern' && 'Foundational phase (0-6 months)'}
                                         {selectedNodeData.id === 'map' && 'Discovery phase (1-3 months)'}
                                         {selectedNodeData.id === 'measure' && 'Assessment phase (2-6 months)'}
                                         {selectedNodeData.id === 'manage' && 'Ongoing operations (continuous)'}
                                       </p>
                                     </div>
                                     <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-green-800 dark:text-green-200">Key Stakeholders</h6>
                                       <p className="text-xs text-green-700 dark:text-green-300">
                                         {selectedNodeData.id === 'govern' && 'C-Suite, Legal, Compliance'}
                                         {selectedNodeData.id === 'map' && 'Risk, Security, Product Teams'}
                                         {selectedNodeData.id === 'measure' && 'QA, Security, Data Science'}
                                         {selectedNodeData.id === 'manage' && 'Operations, Security, IT'}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-2 text-sm">
                                     <span className="font-medium">Contains:</span>
                                     <Badge variant="secondary">{selectedNodeData.data.categories.length} categories</Badge>
                                     <Badge variant="secondary">
                                       {selectedNodeData.data.categories.reduce((total: number, cat: any) => total + cat.subcategories.length, 0)} subcategories
                                     </Badge>
                                   </div>
                                 </div>
                               )}
                              
                              {selectedNodeData.type === 'nist-category' && (
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedNodeData.data.description}
                                  </p>
                                  
                                  <div className="p-4 bg-muted/50 rounded-lg">
                                    <h5 className="font-medium text-sm mb-3">Implementation Guidance:</h5>
                                    <div className="text-xs text-muted-foreground space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Strategic Importance:</strong> This category is fundamental to the {selectedNodeData.parentId?.toUpperCase()} function and establishes critical foundations for AI governance</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Implementation Priority:</strong> Should be addressed in coordination with other {selectedNodeData.parentId?.toUpperCase()} categories for maximum effectiveness</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Cross-Function Impact:</strong> Influences and is influenced by activities in other NIST AI RMF functions (GOVERN, MAP, MEASURE, MANAGE)</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-indigo-800 dark:text-indigo-200">Function Context</h6>
                                      <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                        Part of {selectedNodeData.parentId?.toUpperCase()} function
                                      </p>
                                    </div>
                                    <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-teal-800 dark:text-teal-200">Maturity Level</h6>
                                      <p className="text-xs text-teal-700 dark:text-teal-300">
                                        {selectedNodeData.data.subcategories.length > 6 ? 'Advanced' : 
                                         selectedNodeData.data.subcategories.length > 3 ? 'Intermediate' : 'Foundational'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Contains:</span>
                                    <Badge variant="secondary">{selectedNodeData.data.subcategories.length} subcategories</Badge>
                                    <Badge variant="outline">Click to expand</Badge>
                                  </div>
                                </div>
                              )}
                              
                              {selectedNodeData.type === 'nist-subcategory' && (
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedNodeData.data.description}
                                  </p>
                                  
                                  <div className="p-4 bg-muted/50 rounded-lg">
                                    <h5 className="font-medium text-sm mb-3">Implementation Details:</h5>
                                    <div className="text-xs text-muted-foreground space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Operational Focus:</strong> This subcategory defines specific, actionable requirements that organizations must implement to achieve AI risk management objectives</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Implementation Approach:</strong> Should be addressed through documented policies, technical controls, training programs, and regular assessments</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Success Metrics:</strong> Progress can be measured through compliance audits, risk assessments, and security testing aligned with mapped AISVS controls</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-medium text-sm mb-3 text-blue-800 dark:text-blue-200">🔗 AISVS Security Mappings</h5>
                                    {selectedNodeData.data.aisvsMapping.length > 0 ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                          This NIST subcategory directly supports the following AISVS security controls:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {selectedNodeData.data.aisvsMapping.map((aisvsCode: string) => {
                                            const aisvsCategory = getAISVSCategory(aisvsCode);
                                            return aisvsCategory ? (
                                              <Link key={aisvsCode} to="/aisvs" className="no-underline">
                                                <Badge 
                                                  variant="default" 
                                                  className="text-xs hover:opacity-80 transition-all duration-200 cursor-pointer transform hover:scale-105"
                                                  style={{ backgroundColor: aisvsCategory.color }}
                                                >
                                                  {aisvsCode}: {aisvsCategory.name.split(' &')[0]}
                                                </Badge>
                                              </Link>
                                            ) : (
                                              <Badge key={aisvsCode} variant="outline" className="text-xs">
                                                {aisvsCode}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                                          💡 Click on any AISVS badge above to explore detailed security requirements and testing procedures.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4">
                                        <Badge variant="secondary" className="text-xs mb-2">
                                          No direct AISVS mapping identified
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">
                                          This subcategory may require custom security controls or alignment with general security practices.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-slate-800 dark:text-slate-200">Implementation Complexity</h6>
                                      <p className="text-xs text-slate-700 dark:text-slate-300">
                                        {selectedNodeData.data.aisvsMapping.length > 3 ? 'High - Multi-domain' : 
                                         selectedNodeData.data.aisvsMapping.length > 1 ? 'Medium - Cross-functional' : 
                                         selectedNodeData.data.aisvsMapping.length === 1 ? 'Medium - Focused' : 'Low - Policy-based'}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-emerald-800 dark:text-emerald-200">Security Impact</h6>
                                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {selectedNodeData.data.aisvsMapping.length > 0 ? 'Direct security control alignment' : 'Governance and process focused'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                                                             {selectedNodeData.type === 'aisvs-category' && (
                                 <div className="space-y-4">
                                   <p className="text-sm text-muted-foreground leading-relaxed">
                                     {selectedNodeData.data.description}
                                   </p>
                                   
                                   <div className="p-4 bg-muted/50 rounded-lg">
                                     <h5 className="font-medium text-sm mb-3">Security Domain & Requirements:</h5>
                                     <div className="text-xs text-muted-foreground space-y-2">
                                       {selectedNodeData.label === 'C1' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Memory Safety:</strong> Protect against buffer overflows, memory corruption, and unsafe memory operations in AI systems</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Input Validation:</strong> Ensure robust validation of all inputs to prevent injection attacks and malformed data processing</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Architecture Security:</strong> Implement secure coding practices and architectural patterns for AI applications</span>
                                           </div>
                                         </>
                                       )}
                                       {selectedNodeData.label === 'C2' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Authentication Controls:</strong> Implement strong user authentication and identity verification mechanisms</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Session Management:</strong> Secure session handling, timeout controls, and session invalidation</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Multi-Factor Authentication:</strong> Deploy MFA for privileged access to AI systems and data</span>
                                           </div>
                                         </>
                                       )}
                                       {selectedNodeData.label === 'C3' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Access Control Policies:</strong> Define and enforce granular access controls for AI resources and capabilities</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Role-Based Access:</strong> Implement RBAC/ABAC models appropriate for AI system operations</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Privilege Management:</strong> Apply least privilege principles and regular access reviews</span>
                                           </div>
                                         </>
                                       )}
                                       {['C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13'].includes(selectedNodeData.label) && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Core Security Requirements:</strong> Essential security controls and verification procedures for AI systems</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Implementation Guidelines:</strong> Specific technical requirements and testing methodologies</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Verification Criteria:</strong> Measurable security objectives and compliance checkpoints</span>
                                           </div>
                                         </>
                                       )}
                                     </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3">
                                     <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-purple-800 dark:text-purple-200">Security Level</h6>
                                       <p className="text-xs text-purple-700 dark:text-purple-300">
                                         {['C1', 'C2', 'C3'].includes(selectedNodeData.label) && 'Foundational (Level 1)'}
                                         {['C4', 'C5', 'C6', 'C7'].includes(selectedNodeData.label) && 'Standard (Level 2)'}
                                         {['C8', 'C9', 'C10'].includes(selectedNodeData.label) && 'Advanced (Level 3)'}
                                         {['C11', 'C12', 'C13'].includes(selectedNodeData.label) && 'Expert (Level 4)'}
                                       </p>
                                     </div>
                                     <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-red-800 dark:text-red-200">Testing Focus</h6>
                                       <p className="text-xs text-red-700 dark:text-red-300">
                                         {['C1', 'C4', 'C8'].includes(selectedNodeData.label) && 'Penetration Testing'}
                                         {['C2', 'C5', 'C9'].includes(selectedNodeData.label) && 'Authentication Testing'}
                                         {['C3', 'C6', 'C10'].includes(selectedNodeData.label) && 'Access Control Testing'}
                                         {['C7', 'C11', 'C12', 'C13'].includes(selectedNodeData.label) && 'Specialized Testing'}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                     <h6 className="font-medium text-xs mb-2 text-amber-800 dark:text-amber-200">💡 Reverse Mapping Tip</h6>
                                     <p className="text-xs text-amber-700 dark:text-amber-300">
                                       Click this AISVS category to automatically expand all related NIST AI RMF subcategories in the graph above. This shows you which governance, mapping, measurement, and management activities support this security control.
                                     </p>
                                   </div>
                                   
                                   {selectedNodeData.data.subCategories && (
                                     <div className="flex items-center gap-2 text-sm">
                                       <span className="font-medium">Contains:</span>
                                       <Badge variant="secondary">{selectedNodeData.data.subCategories.length} subcategories</Badge>
                                       <Badge variant="outline">
                                         {selectedNodeData.data.subCategories.length > 5 ? 'Comprehensive' : 
                                          selectedNodeData.data.subCategories.length > 3 ? 'Moderate' : 'Focused'} scope
                                       </Badge>
                                     </div>
                                   )}
                                 </div>
                               )}
                            </div>
                            
                            {/* Right Column - Relationships and Mappings */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Relationships & Mappings
                              </h4>
                              
                              {selectedNodeData.type === 'nist-subcategory' && selectedNodeData.data.aisvsMapping.length > 0 && (
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">Maps to AISVS Categories:</h5>
                                    <div className="space-y-2">
                                      {selectedNodeData.data.aisvsMapping.map((aisvsCode: string) => {
                                        const aisvsCategory = getAISVSCategory(aisvsCode);
                                        return aisvsCategory ? (
                                          <div key={aisvsCode} className="flex items-center gap-2 p-2 border rounded">
                                            <div 
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: aisvsCategory.color }}
                                            ></div>
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{aisvsCategory.code}</div>
                                              <div className="text-xs text-muted-foreground">{aisvsCategory.name.split(' &')[0]}</div>
                                            </div>
                                            <Link to="/aisvs">
                                              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                                                View Details
                                              </Badge>
                                            </Link>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedNodeData.type === 'aisvs-category' && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <h5 className="font-medium text-sm mb-3 text-green-800 dark:text-green-200">
                                      🎯 NIST AI RMF Governance Support
                                    </h5>
                                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                                      This AISVS security control is supported by the following NIST AI RMF subcategories. 
                                      Understanding these connections helps you implement comprehensive AI governance.
                                    </p>
                                    
                                    <div className="space-y-3">
                                      {['govern', 'map', 'measure', 'manage'].map(funcId => {
                                        const func = nistAIRMF.find(f => f.id === funcId);
                                        const mappedSubcategories = func ? func.categories.flatMap(cat =>
                                          cat.subcategories.filter(sub => sub.aisvsMapping.includes(selectedNodeData.label))
                                        ) : [];
                                        
                                        if (mappedSubcategories.length === 0) return null;
                                        
                                        return (
                                          <div key={funcId} className="space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                              <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: func?.color }}
                                              ></div>
                                              <span className="font-medium text-xs" style={{ color: func?.color }}>
                                                {func?.code} - {func?.name} ({mappedSubcategories.length})
                                              </span>
                                            </div>
                                            <div className="ml-5 space-y-1">
                                              {mappedSubcategories.map(sub => (
                                                <div key={sub.id} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 border rounded text-xs">
                                                  <div className="flex-1">
                                                    <div className="font-medium">{sub.code}</div>
                                                    <div className="text-muted-foreground">{sub.name}</div>
                                                    <div className="text-muted-foreground mt-1 text-xs italic">
                                                      "{sub.description.substring(0, 80)}..."
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <h5 className="font-medium text-sm mb-2 text-purple-800 dark:text-purple-200">
                                      📊 Implementation Statistics
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      {['govern', 'map', 'measure', 'manage'].map(funcId => {
                                        const func = nistAIRMF.find(f => f.id === funcId);
                                        const mappedCount = func ? func.categories.flatMap(cat =>
                                          cat.subcategories.filter(sub => sub.aisvsMapping.includes(selectedNodeData.label))
                                        ).length : 0;
                                        
                                        return (
                                          <div key={funcId} className="flex items-center gap-2">
                                            <div 
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: func?.color }}
                                            ></div>
                                            <span className="text-purple-700 dark:text-purple-300">
                                              {func?.code}: {mappedCount} controls
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <h5 className="font-medium text-sm mb-2 text-amber-800 dark:text-amber-200">
                                      🚀 Quick Action
                                    </h5>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                                      Want to see all these NIST subcategories in the graph above?
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                                      💡 Click this AISVS node again to auto-expand all related NIST elements and visualize the complete governance framework supporting this security control.
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {(selectedNodeData.type === 'nist-function' || selectedNodeData.type === 'nist-category') && (
                                <div className="space-y-3">
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-200">
                                      💡 Interaction Tip
                                    </h5>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      Click this node to {expandedNodes.has(selectedNodeData.id) ? 'collapse' : 'expand'} and 
                                      {selectedNodeData.type === 'nist-function' ? ' view its categories and subcategories' : ' view its subcategories'}.
                                    </p>
                                  </div>
                                  
                                  {expandedNodes.has(selectedNodeData.id) && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2">Currently Expanded:</h5>
                                      <div className="text-xs text-muted-foreground">
                                        This node is currently expanded, showing its child elements in the graph above.
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Usage Context */}
                              <div className="mt-4 p-3 bg-accent/50 rounded-lg">
                                <h5 className="font-medium text-sm mb-2">Usage Context:</h5>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {selectedNodeData.type === 'nist-function' && (
                                    <>
                                      <div>• Use for high-level AI governance planning</div>
                                      <div>• Essential for compliance frameworks</div>
                                      <div>• Foundation for risk management strategy</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'nist-category' && (
                                    <>
                                      <div>• Implement through specific procedures</div>
                                      <div>• Map to organizational capabilities</div>
                                      <div>• Essential for targeted risk mitigation</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'nist-subcategory' && (
                                    <>
                                      <div>• Implement through specific controls</div>
                                      <div>• Verify through AISVS requirements</div>
                                      <div>• Essential for detailed compliance</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'aisvs-category' && (
                                    <>
                                      <div>• Use for security verification</div>
                                      <div>• Essential for penetration testing</div>
                                      <div>• Validate AI system security</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Graph Controls and Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Graph Features</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Click nodes to expand/select</li>
                          <li>• Drag nodes to rearrange layout</li>
                          <li>• Zoom and pan for detailed view</li>
                          <li>• Hover for quick information</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Mapping Insights</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• GOVERN maps to foundational controls</li>
                          <li>• MAP focuses on risk identification</li>
                          <li>• MEASURE emphasizes testing & metrics</li>
                          <li>• MANAGE covers incident response</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Usage Guide</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Click nodes for detailed information</li>
                          <li>• Use for compliance planning</li>
                          <li>• Identify coverage gaps</li>
                          <li>• Plan implementation priorities</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* References Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Framework References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">NIST AI Risk Management Framework</h4>
                  <div className="space-y-2">
                    <a
                      href="https://www.nist.gov/itl/ai-risk-management-framework"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>NIST AI RMF Official Documentation</span>
                    </a>
                    <a
                      href="https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>NIST AI RMF 1.0 (PDF)</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">OWASP AISVS</h4>
                  <div className="space-y-2">
                    <Link
                      to="/aisvs"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Interactive AISVS Tool</span>
                    </Link>
                    <a
                      href="https://github.com/OWASP/AISVS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>OWASP AISVS GitHub Repository</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NISTMapping; 