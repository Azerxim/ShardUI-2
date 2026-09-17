import IconPicker from "@/components/ui/IconPicker";
import FieldWrapper from "@/components/modals/fields/FieldWrapper";
import { selectValue } from "@/components/modals/fields/selectValue";

// Champs sans état propre de DynamicModal.
// Props communes : champ (config du champ), value, onChange(name, value)

export function ToggleField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <div className="flex gap-2">
        <input
          type="checkbox"
          name={champ.name}
          checked={value}
          onChange={(e) => onChange(champ.name, e.target.checked)}
          className="toggle toggle-primary"
          required={champ.required}
        />
        <label className="label">
          <span className="label-text text-base-content">
            {champ.option[0].label}
          </span>
        </label>
      </div>
    </FieldWrapper>
  );
}

export function CheckboxField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <div className="flex gap-2">
        <input
          type="checkbox"
          name={champ.name}
          checked={value}
          onChange={(e) => onChange(champ.name, e.target.checked)}
          className="checkbox checkbox-primary"
          required={champ.required}
        />
        <label className="label">
          <span className="label-text text-base-content">
            {champ.option[0].label}
          </span>
        </label>
      </div>
    </FieldWrapper>
  );
}

export function RadioField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <div className="flex flex-row gap-2">
        {champ.option.map((opt, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="radio"
              name={champ.name}
              value={opt.value}
              checked={String(value) === String(opt.value)}
              onChange={(e) => onChange(champ.name, e.target.value)}
              className="radio radio-primary"
              required={champ.required}
            />
            <label className="label">
              <span className="label-text text-base-content">
                {opt.label}
              </span>
            </label>
          </div>
        ))}
      </div>
    </FieldWrapper>
  );
}

export function SelectField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <select
        value={selectValue(value, champ.option.map((opt) => opt.value))}
        className="select select-ghost bg-base-100 brightness-98 w-full"
        onChange={(e) => onChange(champ.name, e.target.value)}
        required={champ.required}
      >
        <option key="placeholder" value="" disabled={true}>
          {champ.placeholder}
        </option>
        {champ.option.map((opt, index) => (
          <option key={index} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function TextareaField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <textarea
        name={champ.name}
        placeholder={champ.placeholder}
        className="textarea textarea-ghost bg-base-100 brightness-98 w-full"
        required={champ.required}
        value={value}
        onChange={(e) => onChange(champ.name, e.target.value)}
      ></textarea>
    </FieldWrapper>
  );
}

export function ColorField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <div className="rounded-3xl" style={{ backgroundColor: value }}>
        <input
          type="color"
          name={champ.name}
          placeholder={champ.placeholder}
          value={value}
          onChange={(e) => onChange(champ.name, e.target.value)}
          className="input input-ghost bg-base-100 brightness-98 w-full"
          style={{ opacity: 0, cursor: "pointer" }}
          required={champ.required}
        />
      </div>
    </FieldWrapper>
  );
}

// Valeur au format FontAwesome : "fa-solid fa-cross", "fa-brands fa-discord"...
export function IconField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <IconPicker
        value={value ?? ""}
        placeholder={champ.placeholder}
        onChange={(icon) => onChange(champ.name, icon)}
      />
    </FieldWrapper>
  );
}

export function DateField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <input
        type="date"
        name={champ.name}
        placeholder={champ.placeholder}
        value={value}
        onChange={(e) => onChange(champ.name, e.target.value)}
        style={{ cursor: "pointer" }}
        className="input input-ghost bg-base-100 brightness-98 w-full"
        required={champ.required}
      />
    </FieldWrapper>
  );
}

// Champ par défaut : input HTML du type indiqué (text, number, url...)
export function InputField({ champ, value, onChange }) {
  return (
    <FieldWrapper champ={champ}>
      <input
        type={champ.type}
        name={champ.name}
        placeholder={champ.placeholder}
        value={value}
        onChange={(e) => onChange(champ.name, e.target.value)}
        className="input input-ghost bg-base-100 brightness-98 w-full"
        required={champ.required}
      />
    </FieldWrapper>
  );
}

// Rendu fourni par la config : champ.render({ config, params }, value, onChange)
export function CustomField({ champ, config, params, value, onChange }) {
  if (!champ.render) return "Invalid custom render function";
  return champ.render({ config, params }, value, onChange);
}
