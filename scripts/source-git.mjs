import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Read the declared upstream commit, regardless of checkout changes. */
export function gitSource(root, repository, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected a full upstream commit SHA');
  const read = args => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  if (read(['remote', 'get-url', 'origin']).toString().trim().replace(/\.git$/, '') !== `https://github.com/${repository}`)
    throw new Error('Local source checkout must use the declared upstream repository');
  return {
    tree(directory) {
      return read(['ls-tree', '-r', '-z', commit, '--', `${directory}/`]).toString().split('\0').filter(Boolean).map(row => {
        const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
        if (!match) throw new Error(`Unsupported upstream tree entry: ${row}`);
        return { path: match[3], name: path.posix.basename(match[3]), blob: match[2], type: 'file' };
      });
    },
    listing(directory) {
      return read(['ls-tree', '-z', commit, '--', `${directory}/`]).toString().split('\0').filter(Boolean).map(row => {
        const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
        return match ? { type: 'file', name: path.posix.basename(match[3]), blob: match[2] } : { type: 'directory' };
      });
    },
    blob(file) { return read(['cat-file', 'blob', file.blob]); },
  };
}
