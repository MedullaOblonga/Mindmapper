import { Drawer } from '../ui';
import { D } from '../../config';
import { useUI } from '../../state/ui';
import type { ShareLogEntry } from '../../types';

export function ShareLogList({ log }: { log: ShareLogEntry[] }) {
  if (!log.length) return <p className="t-body">Nothing has been shared.</p>;
  return (
    <ol className="rows log-list">
      {log.map(e => (
        <li key={e.id}>
          <div className="t-small num">{`Day ${D(e.day)} · to ${e.to}${e.auto ? ' · agreed before launch' : ''}`}</div>
          <p className="t-quote pre">{e.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function ShareLogDrawer({ log }: { log: ShareLogEntry[] }) {
  const ui = useUI();
  return (
    <Drawer title="Share log" onClose={() => ui.openShareLog(false)}>
      <p className="t-small">Every note that has left this device, in full. If a note is not here, it was not sent. Body trends go to your flight surgeon as routine and are not listed one by one.</p>
      <ShareLogList log={log} />
    </Drawer>
  );
}
