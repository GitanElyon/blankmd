document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    
    // Initialize with a welcome message
    editor.innerHTML = '<div class="line h1" data-md="#"><span class="md-syntax"># </span>Welcome to bland.md</div><div class="line"><br></div>';
    
    // Set cursor at end of text
    setCaretToEnd(editor);
    
    // Handle key events
    editor.addEventListener('input', handleInput);
    editor.addEventListener('keydown', handleKeyDown);
    editor.addEventListener('click', handleClick);
    
    // Add selectionchange event to show/hide markdown syntax
    document.addEventListener('selectionchange', updateActiveLine);
    
    // Set up mutation observer to maintain structure
    setupEditorObserver();
    
    // Ensure editor structure is valid
    ensureEditorStructure();
    
    // Save content to localStorage periodically
    setInterval(() => {
        localStorage.setItem('markdown-content', editor.innerHTML);
    }, 1000);
    
    // Load saved content from localStorage
    const savedContent = localStorage.getItem('markdown-content');
    if (savedContent && savedContent.trim() !== '') {
        editor.innerHTML = savedContent;
        ensureEditorStructure(); // Make sure loaded content has proper structure
    }
});

function handleInput(e) {
    const editor = document.getElementById('editor');
    
    // Check if editor is empty
    if (editor.innerHTML.trim() === '' || editor.innerText.trim() === '') {
        editor.innerHTML = '<div class="line"><br></div>';
        setCaretToEnd(editor.querySelector('.line'));
        return;
    }
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentNode = range.startContainer;
    const cursorOffset = range.startOffset;
    
    // Get the current line
    let lineElement = currentNode.nodeType === 1 ? currentNode : currentNode.parentNode;
    while (lineElement && !lineElement.classList.contains('line')) {
        lineElement = lineElement.parentNode;
        if (lineElement === editor) {
            lineElement = null;
            break;
        }
    }
    
    // If not in a line element, we're probably in a new line
    if (!lineElement) {
        wrapTextInLines();
        return;
    }
    
    // Save cursor information before formatting
    const beforeText = lineElement.textContent;
    const beforeHTML = lineElement.innerHTML;
    
    // Get text content of the line
    const text = lineElement.textContent;
    
    // Apply markdown formatting based on the first characters
    applyMarkdownFormatting(lineElement, text);
    
    // Restore cursor position after formatting
    restoreCursorPosition(lineElement, beforeText, beforeHTML, currentNode, cursorOffset);
    
    // Make sure to update the active line
    updateActiveLine();
}

function restoreCursorPosition(lineElement, beforeText, beforeHTML, originalNode, originalOffset) {
    const selection = window.getSelection();
    
    // If we're typing in a header, we need special handling
    if (lineElement.classList.contains('h1') || lineElement.classList.contains('h2') || lineElement.classList.contains('h3')) {
        const syntaxSpan = lineElement.querySelector('.md-syntax');
        if (!syntaxSpan) return; // Safety check
        
        // Get the text node after the syntax span
        let targetNode = null;
        let found = false;
        
        // Find the appropriate text node to place cursor
        for (const node of lineElement.childNodes) {
            if (found && node.nodeType === 3) {
                targetNode = node;
                break;
            }
            if (node === syntaxSpan) {
                found = true;
            }
        }
        
        if (!targetNode) {
            // If there's no text node after syntax, create one
            targetNode = document.createTextNode('');
            lineElement.appendChild(targetNode);
        }
        
        // Calculate new offset based on original position
        let newOffset = originalOffset;
        if (originalNode === syntaxSpan || originalNode.parentNode === syntaxSpan) {
            // If cursor was in syntax span, place it at the beginning of content
            newOffset = 0;
        } else if (originalNode.nodeType === 3 && originalNode !== targetNode) {
            // If cursor was in a different text node, try to map position
            newOffset = originalOffset;
            // Adjust for the hidden syntax characters
            if (syntaxSpan && originalOffset > 0) {
                // Don't subtract if cursor was at position 0
                newOffset = Math.max(0, originalOffset - syntaxSpan.textContent.length);
            }
        }
        
        // Set cursor position
        const range = document.createRange();
        range.setStart(targetNode, Math.min(newOffset, targetNode.length));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
    }
    
    // For non-header lines or fallback
    // If the HTML didn't change, no need to adjust cursor
    if (lineElement.innerHTML === beforeHTML) return;
    
    const range = document.createRange();
    
    // Handle special case: markdown syntax at the beginning
    const syntaxElement = lineElement.querySelector('.md-syntax');
    if (syntaxElement) {
        // If cursor was in or before the syntax part
        if (originalNode === syntaxElement || 
            (originalNode.nodeType === 3 && originalOffset <= syntaxElement.textContent.length)) {
            // Find the first text node after syntax
            let nextNode = null;
            let foundSyntax = false;
            
            for (const node of lineElement.childNodes) {
                if (foundSyntax && node.nodeType === 3) {
                    nextNode = node;
                    break;
                }
                if (node === syntaxElement) {
                    foundSyntax = true;
                }
            }
            
            if (nextNode) {
                range.setStart(nextNode, 0);
            } else {
                // Create a text node if needed
                nextNode = document.createTextNode('');
                lineElement.appendChild(nextNode);
                range.setStart(nextNode, 0);
            }
            
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
    }
    
    // General case - try to find appropriate text node
    const textNodes = Array.from(lineElement.childNodes).filter(node => node.nodeType === 3);
    
    if (textNodes.length > 0) {
        // Calculate adjusted offset
        let adjustedOffset = originalOffset;
        if (syntaxElement && originalNode.nodeType === 3) {
            // Adjust offset to account for hidden syntax
            adjustedOffset = Math.max(0, adjustedOffset - syntaxElement.textContent.length);
        }
        
        // Find the text node and offset to place cursor
        let currentPos = 0;
        for (const node of textNodes) {
            if (currentPos + node.length >= adjustedOffset) {
                range.setStart(node, adjustedOffset - currentPos);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            currentPos += node.length;
        }
        
        // If we couldn't find the right position, place at end of last text node
        const lastNode = textNodes[textNodes.length - 1];
        range.setStart(lastNode, lastNode.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // No text nodes - place at end
        setCaretToEnd(lineElement);
    }
}

// Add this new function to maintain editor structure
function ensureEditorStructure() {
    const editor = document.getElementById('editor');
    
    // If editor is completely empty, add a line
    if (editor.innerHTML.trim() === '') {
        editor.innerHTML = '<div class="line"><br></div>';
        return true;
    }
    
    // If there are non-line elements at the root level, wrap them
    let needsWrapping = false;
    Array.from(editor.childNodes).forEach(node => {
        if (node.nodeType === 3 || (node.nodeType === 1 && !node.classList.contains('line'))) {
            needsWrapping = true;
        }
    });
    
    if (needsWrapping) {
        wrapTextInLines();
        return true;
    }
    
    return false;
}

// Add a mutation observer to watch for changes
function setupEditorObserver() {
    const editor = document.getElementById('editor');
    const observer = new MutationObserver(mutations => {
        // Schedule check after DOM changes
        setTimeout(() => {
            if (ensureEditorStructure()) {
                // If structure was fixed, restore cursor position intelligently
                const selection = window.getSelection();
                if (!selection.rangeCount) {
                    setCaretToEnd(editor.querySelector('.line:last-child'));
                }
            }
        }, 0);
    });
    
    observer.observe(editor, { 
        childList: true, 
        subtree: true, 
        characterData: true 
    });
}

function handleKeyDown(e) {
    // Handle specific key events (Enter, Tab, etc.)
    if (e.key === 'Enter') {
        e.preventDefault();
        
        // Insert a new line div
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Find current line element
        let currentLineElement = range.startContainer;
        if (currentLineElement.nodeType === 3) { // Text node
            currentLineElement = currentLineElement.parentNode;
        }
        while (currentLineElement && !currentLineElement.classList.contains('line')) {
            currentLineElement = currentLineElement.parentNode;
        }
        
        // Create a new line element
        const newLine = document.createElement('div');
        newLine.className = 'line';
        newLine.innerHTML = '<br>'; // Ensure the line has content for cursor positioning
        
        // If we're in the middle of a line, split the content
        if (currentLineElement && currentLineElement.classList.contains('line')) {
            const editor = document.getElementById('editor');
            
            // Insert after the current line
            if (currentLineElement.nextSibling) {
                editor.insertBefore(newLine, currentLineElement.nextSibling);
            } else {
                editor.appendChild(newLine);
            }
            
            // If the cursor is not at the end of the line, split the content
            if (range.startOffset < currentLineElement.textContent.length) {
                // Clone the selection to the end of the line
                const endRange = range.cloneRange();
                endRange.setStartAfter(range.startContainer);
                endRange.setEndAfter(currentLineElement.lastChild);
                
                // Move this content to the new line
                if (!endRange.collapsed) {
                    newLine.innerHTML = '';
                    newLine.appendChild(endRange.extractContents());
                }
            }
        } else {
            // Fallback if we can't find the current line
            document.execCommand('insertLineBreak');
            return;
        }
        
        // Set cursor to new line
        const newRange = document.createRange();
        newRange.selectNodeContents(newLine);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update active line after key actions
        setTimeout(updateActiveLine, 0);
        
        return false;
    }
}

function handleClick(e) {
    updateActiveLine();
}

function applyMarkdownFormatting(lineElement, text) {
    // Remove existing classes except 'line'
    lineElement.className = 'line';
    
    // Clear existing markdown syntax span
    const existingSyntax = lineElement.querySelector('.md-syntax');
    if (existingSyntax) {
        existingSyntax.remove();
    }
    
    // Check for headers
    if (text.startsWith('# ')) {
        lineElement.classList.add('h1');
        addSyntaxSpan(lineElement, '# ');
    } else if (text.startsWith('## ')) {
        lineElement.classList.add('h2');
        addSyntaxSpan(lineElement, '## ');
    } else if (text.startsWith('### ')) {
        lineElement.classList.add('h3');
        addSyntaxSpan(lineElement, '### ');
    }
    
    // Check for list items
    else if (text.startsWith('- ') || text.startsWith('* ')) {
        lineElement.classList.add('list-item');
        addSyntaxSpan(lineElement, text.substring(0, 2));
    }
    
    // Process inline formatting (bold, italic, code) later
    processInlineFormatting(lineElement);
}

function addSyntaxSpan(lineElement, syntax) {
    // Save selection state
    const selection = window.getSelection();
    let savedRange = null;
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    // Create a span to contain the markdown syntax
    const syntaxSpan = document.createElement('span');
    syntaxSpan.className = 'md-syntax';
    syntaxSpan.textContent = syntax;
    
    // Insert at beginning of line
    lineElement.insertBefore(syntaxSpan, lineElement.firstChild);
    
    // Remove the syntax from the text content
    const textNode = Array.from(lineElement.childNodes).find(node => 
        node.nodeType === 3 && node.textContent.startsWith(syntax));
    
    if (textNode) {
        textNode.textContent = textNode.textContent.substring(syntax.length);
    }
    
    // Restore selection if it was saved
    if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }
}

function processInlineFormatting(lineElement) {
    // This would handle inline formatting like **bold**, *italic*, `code`
    // For simplicity, we're not implementing the full inline formatting here
    // A complete implementation would parse the text and create span elements
}

function wrapTextInLines() {
    const editor = document.getElementById('editor');
    
    // Get all text nodes that are direct children of the editor
    const textNodes = Array.from(editor.childNodes).filter(node => 
        node.nodeType === 3 && node.textContent.trim() !== '');
    
    // Wrap each text node in a line div
    textNodes.forEach(node => {
        const line = document.createElement('div');
        line.className = 'line';
        
        // Replace the text node with the line
        editor.replaceChild(line, node);
        
        // Add the text to the line
        line.appendChild(node);
        
        // Apply formatting
        applyMarkdownFormatting(line, node.textContent);
    });
}

function setCaretToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
}

// Add this new function to handle showing/hiding syntax based on cursor position
function updateActiveLine() {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    
    // Hide all syntax markers first
    document.querySelectorAll('.md-syntax').forEach(el => {
        el.style.display = 'none';
    });
    
    // If there's a selection
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;
        
        // Find the active line
        let activeLine = currentNode.nodeType === 1 ? currentNode : currentNode.parentNode;
        while (activeLine && !activeLine.classList.contains('line')) {
            activeLine = activeLine.parentNode;
            if (activeLine === editor) {
                activeLine = null;
                break;
            }
        }
        
        // If we found an active line, show its syntax markers
        if (activeLine) {
            const syntaxMarker = activeLine.querySelector('.md-syntax');
            if (syntaxMarker) {
                syntaxMarker.style.display = 'inline';
            }
        }
    }
}