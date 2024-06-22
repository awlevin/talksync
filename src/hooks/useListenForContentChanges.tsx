import { useEffect, useState } from 'react';

export const useListenForContentChanges = () => {
  const [content, setContent] = useState("");
  useEffect(() => {
    // Function to handle changes
    const handleMutations = (mutations: MutationRecord[]) => {
      for (let mutation of mutations) {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          setContent(mutation.target.textContent || "");
        }
      }
    };

    // Set up the observer
    const observer = new MutationObserver(handleMutations);

    // Get the external element
    const externalElement = document.getElementById("content-area");

    if (externalElement) {
      // Start observing the element
      observer.observe(externalElement, {
        childList: true, // observe direct children
        characterData: true, // observe the text content
        subtree: true, // observe all descendants
      });

      // Set initial text
      setContent(externalElement.textContent || "");
    }

    // Cleanup function
    return () => {
      if (externalElement) {
        observer.disconnect();
      }
    };
  });

  return content;
};
