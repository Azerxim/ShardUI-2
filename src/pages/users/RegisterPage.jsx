import Navbar from "@/components/layout/Navbar";
import Skeleton from '@/components/ui/Skeleton';
import Register from '@/components/users/Register';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function RegisterPage() {
  return (
    <>
      <Navbar active="register" />
      <Register />
    </>
  );
}