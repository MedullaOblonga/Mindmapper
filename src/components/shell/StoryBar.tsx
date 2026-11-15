import params from '../../data/scenario-params.json';

export function StoryBar({ day }: { day: number }) {
  return (
    <nav className="storybar" aria-label="Demo story">
      <span className="t-label storybar-label">Demo story · simulated</span>
      <div className="story-chips">
        {params.chapters.map(c => (
          <button key={c.id} className="story-chip" aria-current={c.day === day ? 'true' : undefined}>{c.label}</button>
        ))}
      </div>
      <span className="story-step">
        <button className="btn btn--sm" aria-label="Previous day">‹</button>
        <span className="t-small num story-day">Day {day}</span>
        <button className="btn btn--sm" aria-label="Next day">›</button>
      </span>
    </nav>
  );
}
