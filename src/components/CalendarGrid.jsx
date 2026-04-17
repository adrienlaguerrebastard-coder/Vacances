import { getDaysOfMonthUTC, monthLabel, toISO } from "../lib/date";

function Month({ year, month, selectedDates, onToggle, readonly, disabled }) {
  const days = getDaysOfMonthUTC(year, month);
  const firstWeekDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const blanks = Array.from({ length: firstWeekDay === 0 ? 6 : firstWeekDay - 1 });

  return (
    <div className="card">
      <h3>
        {monthLabel(month)} {year}
      </h3>
      <div className="month-grid">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <strong key={`${d}-${i}`}>{d}</strong>
        ))}
        {blanks.map((_, i) => (
          <span key={`b-${i}`} />
        ))}
        {days.map((d) => {
          const iso = toISO(d);
          const active = selectedDates.has(iso);
          const isDisabled = readonly || disabled;
          return (
            <button
              key={iso}
              className={`day ${active ? "selected" : ""} ${readonly ? "readonly" : ""}`}
              onClick={() => !isDisabled && onToggle?.(iso)}
              type="button"
              disabled={isDisabled}
              aria-pressed={active}
              aria-label={`${monthLabel(month)} ${d.getUTCDate()} ${year}${active ? ", sélectionné" : ""}`}
            >
              {d.getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarGrid({ year, selectedDates, onToggle, readonly = false, disabled = false }) {
  return (
    <div className="calendar" role="group" aria-label={`Calendrier ${year}`}>
      <Month
        year={year}
        month={7}
        selectedDates={selectedDates}
        onToggle={onToggle}
        readonly={readonly}
        disabled={disabled}
      />
      <Month
        year={year}
        month={8}
        selectedDates={selectedDates}
        onToggle={onToggle}
        readonly={readonly}
        disabled={disabled}
      />
    </div>
  );
}
