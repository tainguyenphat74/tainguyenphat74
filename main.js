document.addEventListener('DOMContentLoaded', () => {
    console.log("%c Portfolio V3: Structured Bento Grid Initialized ", "background: #000; color: #3b82f6; padding: 5px 10px; border-radius: 5px; font-weight: bold;");
    
    // Add a subtle entrance animation for bento items
    const items = document.querySelectorAll('.bento-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
});
