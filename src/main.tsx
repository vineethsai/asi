import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import App from './App.tsx'
import '@radix-ui/themes/styles.css'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <Theme 
    appearance="inherit" 
    accentColor="indigo" 
    grayColor="gray" 
    radius="medium" 
    scaling="100%" 
    panelBackground="solid"
    hasBackground={false}
  >
    <App />
  </Theme>
);
