// Native anchors own activation; arrival only updates their destination and visibility.
export function updateNearby(links, project) {
 for (const link of links) {
  link.hidden = !project;
  if (project) {
   link.href = project.url;
   link.target = '_blank';
   link.rel = 'noopener noreferrer';
   link.textContent = `Open ${project.name} in new tab ↗`;
  } else {
   link.removeAttribute('href');
   link.textContent = '';
  }
 }
}
