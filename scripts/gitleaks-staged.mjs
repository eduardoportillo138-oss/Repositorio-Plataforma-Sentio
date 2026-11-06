// Escanea con gitleaks los cambios en stage. Lo ejecuta el hook pre-commit de lefthook.
// Si gitleaks no está instalado, el commit se bloquea: es preferible a dejar pasar un secreto.
import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'gitleaks',
  ['git', '--pre-commit', '--staged', '--redact', '--no-banner', '--verbose'],
  { stdio: 'inherit' },
);

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error(
      [
        '',
        'gitleaks no está instalado y el hook pre-commit lo necesita para buscar secretos.',
        '  Windows: winget install --id Gitleaks.Gitleaks -e',
        '  macOS:   brew install gitleaks',
        '  Linux:   https://github.com/gitleaks/gitleaks/releases',
        'Después abre una terminal nueva y vuelve a hacer el commit.',
        '',
      ].join('\n'),
    );
  } else {
    console.error(`No se pudo ejecutar gitleaks: ${result.error.message}`);
  }
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    '\ngitleaks encontró posibles secretos en los cambios en stage. Quítalos antes de hacer commit.\n' +
      'Si es un falso positivo, añade el hallazgo a .gitleaksignore (con su fingerprint).',
  );
}
process.exit(result.status ?? 1);
