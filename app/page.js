import Dashboard from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export const metadata = {
  title: "EcoPulse Ghana | Forest Carbon Monitoring",
    description: "Geoportal for mapping forest carbon stock and estimated carbon loss associated with mining disturbance across Ghana.",
};

export default function Page() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
