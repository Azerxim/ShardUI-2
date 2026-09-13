import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import { getUsers, transferFounderCivilisation, transferFounderReligion, transferFounderCommerce } from "../../services/api";

// label : "Transférer …", of : "fondateur …", to : "ajouté …", pronoun : "de … transférer"
const ENTITIES = {
  civilisation: { label: "la civilisation", of: "de la civilisation", to: "à la civilisation", pronoun: "la", transfer: transferFounderCivilisation },
  religion: { label: "la religion", of: "de la religion", to: "à la religion", pronoun: "la", transfer: transferFounderReligion },
  commerce: { label: "le commerce", of: "du commerce", to: "au commerce", pronoun: "le", transfer: transferFounderCommerce },
};

// Transfert du rôle de fondateur d'une civilisation, d'une religion ou d'un commerce à un autre utilisateur.
// Réservé au fondateur actuel ou à un administrateur du site (vérifié par l'API).
export default function TransferFounderModal({ id, entity = "civilisation", entityId, members = [], onTransfer = () => { } }) {
  const { label, of, to, pronoun, transfer } = ENTITIES[entity];
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [formerRole, setFormerRole] = useState("Admin");

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const founder = members.find((member) => member.role === "Fondateur");
  const candidates = users.filter((user) => user.id !== founder?.user_id);
  const nameOf = (user) => user?.full_name || user?.username || "Utilisateur inconnu";
  const roleOf = (uid) => members.find((member) => member.user_id === uid)?.role;

  const close = () => document.getElementById(id)?.close();

  const resetForm = () => {
    setUserId("");
    setFormerRole("Admin");
  };

  const handleCancel = () => {
    close();
    resetForm();
  };

  const saveData = async (event) => {
    event.preventDefault();
    const target = users.find((user) => String(user.id) === userId);
    if (!target) return;

    // La modale (top layer) masquerait les alertes : on la ferme avant de les afficher
    close();
    const confirm = await Swal.fire({
      icon: "warning",
      title: `Transférer ${label} ?`,
      text: `${nameOf(target)} deviendra fondateur ${of}.${founder ? ` L'actuel fondateur deviendra ${formerRole}.` : ""}`,
      showCancelButton: true,
      confirmButtonText: "Transférer",
      cancelButtonText: "Annuler",
    });
    if (!confirm.isConfirmed) {
      document.getElementById(id)?.showModal();
      return;
    }

    try {
      const data = await transfer(entityId, target.id, formerRole);
      Swal.fire({ icon: "success", title: "Succès", text: `${nameOf(target)} est maintenant fondateur ${of}.` });
      onTransfer(data.members || []);
      resetForm();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Oops...", text: error.message });
    }
  };

  return (
    <dialog id={id} className="modal">
      <div className="modal-box max-h-[90dvh] overflow-y-auto">
        <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
          Transférer {label}
        </h3>
        <div className="divider divider-neutral"></div>
        <form onSubmit={saveData}>
          <button
            className="btn btn-md btn-circle btn-ghost absolute right-4 top-4"
            type="button"
            onClick={handleCancel}
          >
            <FontAwesomeIcon icon="fas fa-xmark" size="xl" />
          </button>
          <div className="modal-content flex flex-col gap-5">
            <div role="alert" className="alert alert-warning alert-soft">
              <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
              <span>
                Le nouveau fondateur obtiendra tous les droits sur {label}, dont celui de {pronoun} transférer à nouveau.
              </span>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nouveau fondateur</legend>
              <select
                value={userId}
                className="select select-ghost bg-base-100 brightness-98 w-full"
                onChange={(e) => setUserId(e.target.value)}
                required={true}
              >
                <option value="" disabled={true}>
                  Sélectionner un utilisateur
                </option>
                {candidates.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {nameOf(user)} {roleOf(user.id) ? `(${roleOf(user.id)})` : "(non membre)"}
                  </option>
                ))}
              </select>
              <p className="label">Un utilisateur qui n'est pas membre sera ajouté {to}.</p>
            </fieldset>

            {founder ? (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nouveau rôle de l'actuel fondateur</legend>
                <div className="flex flex-row gap-4">
                  {["Admin", "Membre"].map((role) => (
                    <label key={role} className="flex flex-row items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`${id}-former-role`}
                        value={role}
                        checked={formerRole === role}
                        onChange={(e) => setFormerRole(e.target.value)}
                        className="radio radio-primary"
                      />
                      <span className="label-text text-base-content">{role}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </div>
          <div className="modal-action flex flex-row-reverse gap-2 justify-between">
            <div className="flex flex-row gap-2">
              <div className="tooltip" data-tip="Annuler">
                <button type="button" className="btn btn-md rounded-3xl" onClick={handleCancel}>
                  <FontAwesomeIcon icon="fas fa-xmark" />
                </button>
              </div>
              <div className="tooltip tooltip-warning" data-tip="Transférer">
                <button type="submit" className="btn btn-md btn-warning rounded-3xl gap-2" disabled={!userId}>
                  <FontAwesomeIcon icon="fa-solid fa-arrow-right-arrow-left" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Close</button>
      </form>
    </dialog>
  );
}
