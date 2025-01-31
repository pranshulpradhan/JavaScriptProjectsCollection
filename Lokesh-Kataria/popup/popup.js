import { getCurrentTab } from "../getTabs.js";

console.log(getCurrentTab());

let heading = document.querySelector(".title");
let bookmarks = document.querySelector(".bookmarks");
let tabUrl = "";

getCurrentTab()
  .then((res) => {
    tabUrl = res.url;
    if (tabUrl.includes("www.youtube.com/")) {
      heading.innerText = "YouTube TimeStamps";
    } else {
      console.log(tabUrl);
      heading.innerText = "This is not a Youtube Page";
    }
  })
  .catch((err) => {
    console.log(err);
  });

// to convert timestamp in seconds
let splitTime = (time) => {
  let timeArray = time.split(":");
  let timeInSeconds =
    timeArray.length > 2
      ? parseInt(timeArray[0]) * 60 * 60 +
        parseInt(timeArray[1]) * 60 +
        parseInt(timeArray[2])
      : parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
  return timeInSeconds;
};

// Function to add a timestamp to the extension popup
let addBookmarkElement = (time, url) => {
  let timeInSeconds = splitTime(time);

  let bookmarkElement = document.createElement("div");
  bookmarkElement.className = "bookmark-item";
  bookmarkElement.innerHTML = `<span contentEditable>Bookmark at </span><span class="time">${time}</span>
    <div>
        <button class="play" name="${url}&t=${timeInSeconds}">Play</button>
        <button class="delete">Delete</button>
    </div>`;

  bookmarks.appendChild(bookmarkElement);
};

document.addEventListener("DOMContentLoaded", () => {
  let body = document.querySelector("body");
  body.style.background = `url(${tabUrl})`;

  // Retrieve data from storage
  chrome.storage.local.get({ bookmarks: {} }, function (result) {
    console.log("Stored data in storage:", result);

    // Extract the array of timestamps for the current videoId
    const videoId = tabUrl.split("?")[1].substring(2);
    const timeStampArray = result.bookmarks[videoId] || [];

    console.log("Retrieved timestamps for videoId:", videoId, timeStampArray);

    // sorting the timeStampArray to display in order
    timeStampArray.sort((a, b) => {
      return splitTime(a) - splitTime(b);
    });

    // Clear existing bookmarks
    bookmarks.innerHTML = "";

    // Display the data in the extension popup
    timeStampArray.forEach((timestamp) => {
      addBookmarkElement(timestamp, tabUrl);
    });
  });

  // Event listener for playing and deleting the bookmarked stamps
  bookmarks.addEventListener("click", (e) => {
    if (e.target.className === "delete") {
      let timeValue =
        e.target.parentElement.parentElement.firstElementChild
          .nextElementSibling.innerText;

      let videoId = tabUrl.split("?")[1].substring(2);

      // Retrieve existing timestamps from storage
      chrome.storage.local.get({ bookmarks: {} }, function (result) {
        let timeStampArray = result.bookmarks[videoId] || [];

        // delete the current timestamp from the array
        timeStampArray = result.bookmarks[videoId].filter(
          (item) => item !== timeValue
        );

        // Save the updated array back to storage
        chrome.storage.local.set(
          { bookmarks: { ...result.bookmarks, [videoId]: timeStampArray } },
          () => {
            console.log("Data added to storage:", {
              bookmarks: { ...result.bookmarks, [videoId]: timeStampArray },
            });
          }
        );
      });
      // Remove the timestamp from the extension popup
      e.target.parentElement.parentElement.remove();
    } else if (e.target.className === "play") {
      // Event listener for playing the video at the bookmarked timestamp
      let timeValue = e.target.parentElement.previousElementSibling.innerText;
      // chrome.runtime.sendMessage({
      //   type: "PLAY",
      //   url: e.target.name,
      //   timeStampValue: timeValue,
      // });

      setTimeout(() => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
              type: "PLAY",
              url: e.target.name,
              timeStampValue: timeValue,
            });
          }
        );
      }, 1000);
    }
  });
});
