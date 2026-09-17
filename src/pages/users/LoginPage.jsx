import Navbar from "@/components/layout/Navbar";
import Skeleton from '@/components/ui/Skeleton';
import Login from '@/components/users/Login';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function LoginPage() {
  return (
    <>
      <Navbar active="login" />
      <Login />
    </>
  );
}