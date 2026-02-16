# OWASP Securing Agentic Applications Guide

## Project Info

**Live Site**: https://agenticsecurity.info/  
**GitHub Repository**: https://github.com/vineethsai/asi/  
**Author**: [Vineeth Sai](http://vineethsai.com/) | [LinkedIn](https://www.linkedin.com/in/vineethsai/)

## About

This is an interactive web application that provides a comprehensive guide for securing AI agentic applications using OWASP best practices. The guide includes:

- **Components**: 6 key components of agentic AI systems with security considerations
- **Architectures**: Common AI system architectures and their security patterns
- **Threats**: Comprehensive threat catalog with attack vectors and impact analysis
- **Controls**: Security controls and mitigations with implementation guidance
- **Assessment Tool**: Interactive security assessment for agentic AI systems
- **Interactive Explorer**: Visual graph-based exploration of components, threats, and mitigations

## How to Run Locally

If you want to work locally using your own IDE, you can clone this repo and run it locally.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone https://github.com/vineethsai/asi.git

# Step 2: Navigate to the project directory
cd asi

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Quality Checks

Run these checks before opening a pull request:

```sh
# Validate vulnerability markdown schema and cross-links
npm run test-vulns

# Validate cross-dataset integrity (threats, controls, AISVS, MITRE mappings)
npm run check:data

# Optional: lint and build
npm run lint
npm run build
```

## OSS Contribution Docs

- Contribution guide: `CONTRIBUTING.md`
- Security reporting policy: `SECURITY.md`

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **D3.js** - Interactive data visualizations
- **React Helmet** - SEO optimization

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Header, Footer, etc.)
│   ├── home/           # Homepage sections
│   ├── architecture/   # Architecture explorer components
│   ├── assessment/     # Assessment tool components
│   └── components/     # Framework data and component logic
├── pages/              # Page components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and data
```

## Features

### 🔍 Interactive Security Explorer
- Visual graph-based exploration of AI security components
- Interactive node selection and relationship mapping
- Fullscreen mode for detailed analysis

### 📊 Security Assessment Tool
- Comprehensive questionnaire for AI system evaluation
- Risk scoring and personalized recommendations
- Export capabilities for security reports

### 📚 Comprehensive Documentation
- Detailed component security guides
- Architecture pattern analysis
- Threat modeling with attack vectors
- Implementation-ready security controls

### 🎯 SEO Optimized
- Complete meta tag optimization
- Open Graph and Twitter Card support
- Structured data (Schema.org) implementation
- Social media sharing optimization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is part of the OWASP Securing Agentic Applications project.

## Contact

- **Author**: [Vineeth Sai](http://vineethsai.com/)
- **LinkedIn**: [vineethsai](https://www.linkedin.com/in/vineethsai/)
- **GitHub**: [vineethsai/asi](https://github.com/vineethsai/asi/)
- **OWASP Project**: [Securing Agentic Applications](https://owasp.org/www-project-securing-agentic-applications/)
