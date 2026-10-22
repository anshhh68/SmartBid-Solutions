import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { WhatsAppFloat } from '../components/layout/WhatsAppFloat';

const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default PublicLayout;
