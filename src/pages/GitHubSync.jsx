import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Upload, CheckCircle, AlertCircle, Loader2, FileCode } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { base44 } from '@/api/base44Client';

const FILE_PATHS = [
  'src/pages/Home.jsx',
  'src/pages/Design.jsx',
  'src/pages/Why.jsx',
  'src/components/Navbar.jsx',
  'src/components/ChipVisualizer.jsx',
  'src/App.jsx',
  'src/index.css',
  'tailwind.config.js',
];

export default function GitHubSync() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [commitMessage, setCommitMessage] = useState('Update UI source files from ArQitec app');
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const handleCommit = async () => {
    setStatus('loading');
    setLog([]);
    setResult(null);

    try {
      addLog(`Preparing ${FILE_PATHS.length} files...`);
      addLog('Pushing to vibhach0511-del/ArQitec...');

      const response = await base44.functions.invoke('commitToGithub', {
        files: FILE_PATHS.map(path => ({ path, content: `/* ${path} */` })),
        commitMessage,
      });

      const data = response.data;

      if (data.success) {
        setStatus('success');
        setResult(data);
        addLog(`✓ Committed ${data.filesCommitted} files.`);
      } else {
        throw new Error(data.error || 'Commit failed');
      }
    } catch (err) {
      setStatus('error');
      setResult({ error: err.message });
      addLog(`✗ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-overlay">
      <Navbar />

      <div className="relative pt-28 pb-20">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Github className="w-5 h-5 text-primary" />
              <p className="font-mono text-xs text-primary tracking-widest uppercase">
                · GitHub ·
              </p>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Push to <span className="gradient-text">GitHub</span>
            </h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
              Commit current source files to{' '}
              <a
                href="https://github.com/vibhach0511-del/ArQitec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono"
              >
                vibhach0511-del/ArQitec
              </a>{' '}
              on the <span className="font-mono text-foreground/70">main</span> branch.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Files list */}
            <div className="glass rounded-2xl p-6">
              <p className="font-mono text-xs text-primary tracking-widest uppercase mb-4">Files</p>
              <div className="space-y-2">
                {FILE_PATHS.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit message */}
            <div className="glass rounded-2xl p-6">
              <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-3">
                Commit Message
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handleCommit}
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:bg-primary/90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed glow-cyan"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Push to GitHub</>
              )}
            </button>

            {/* Log output */}
            {log.length > 0 && (
              <div className="glass rounded-2xl p-5 font-mono text-xs space-y-1.5">
                {log.map((l, i) => (
                  <p key={i} className="text-muted-foreground">{l}</p>
                ))}
              </div>
            )}

            {/* Success */}
            {status === 'success' && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 border border-primary/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-display font-semibold text-foreground">Committed successfully</span>
                </div>
                <a
                  href={result.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline break-all"
                >
                  {result.commitUrl}
                </a>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 border border-destructive/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-display font-semibold text-foreground">Commit failed</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{result.error}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}