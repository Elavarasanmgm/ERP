/**
 * ModuleLayout — shared slanted-tab layout used by every module page.
 *
 * Usage:
 *   <ModuleLayout tabs={tabs} active={active} onChange={setActive}>
 *     {content}
 *   </ModuleLayout>
 *
 * tabs: [{ id, label, Icon }]
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const SKEW = 14;

function SlantedTab({ id, label, Icon, active, onClick, isFirst }) {
  const isActive = active === id;
  const leftSlant = isFirst ? 0 : SKEW;
  const clip = `polygon(${leftSlant}px 0%, calc(100% - ${SKEW}px) 0%, 100% 100%, 0% 100%)`;

  return (
    <Box
      onClick={() => onClick(id)}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        ml: isFirst ? 0 : `${-(SKEW - 1)}px`,
        zIndex: isActive ? 20 : 1,
        '&:hover .tab-inner': !isActive ? { bgcolor: '#c8d2e0' } : {},
      }}
    >
      <Box
        className="tab-inner"
        sx={{
          clipPath: clip,
          bgcolor: isActive ? '#1e3a5f' : '#d4dbe8',
          px: `${SKEW + 10}px`,
          pr: `${SKEW + 14}px`,
          pt: '8px',
          pb: isActive ? '10px' : '8px',
          mb: isActive ? '-2px' : 0,
          transition: 'background-color 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Icon sx={{ fontSize: 15, color: isActive ? '#93c5fd' : '#5a6a80', flexShrink: 0 }} />
          <Typography sx={{
            fontSize: '0.8rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? '#f1f5f9' : '#374151',
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function ModuleLayout({ tabs, active, onChange, children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Slanted tab bar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-end',
        px: 1.5,
        pt: 1.5,
        bgcolor: '#eef1f6',
        borderBottom: '2px solid #1e3a5f',
        overflowX: 'auto',
        overflowY: 'visible',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {tabs.map((t, i) => (
          <SlantedTab
            key={t.id}
            id={t.id}
            label={t.label}
            Icon={t.Icon}
            active={active}
            onClick={onChange}
            isFirst={i === 0}
          />
        ))}
      </Box>

      {/* Content panel */}
      <Box sx={{
        flex: 1,
        bgcolor: '#fff',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Box sx={{ width: '100%', maxWidth: '1400px', flex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
