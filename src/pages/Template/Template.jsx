import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import ServerEtat from '../../components/Sections/ServerEtat';
import Skeleton from "../../components/Sections/Skeleton";

import './Template.css';

export default function TemplatePage() {
  return (
    <>
      <Navbar active="template" />
      <section className="container mx-auto px-4 py-2">
        <ServerEtat />
      </section>
      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <Skeleton></Skeleton>
        </div>
      </main>
    </>
  );
}
