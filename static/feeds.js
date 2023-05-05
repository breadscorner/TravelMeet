
const feedsButton = document.getElementById('feed-link');
const feedsContainer = document.getElementById('feeds-container');

// Fetch from backend
const getPosts = async (category) => {
  try {
    const response = await fetch(`/api-posts/posts?limit=10&category=${category}`, { signal: abortController.signal });
    const data = await response.json();
    if (data) {
      console.log(data);
      return data.posts;
    } else {
      console.log("Something went wrong");
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Get posts fetch aborted. Aborted all pending feeds request.");
    } else {
      console.log(error);
    }
  };
}

// Create function to create post cards
const createPostCard = async (post) => {
  const postLink = document.createElement('a');
  postLink.href = `/posts/${post.id}`;
  postLink.classList.add('w-full', 'h-3/4', 'absolute');
  const card = document.createElement('div');
  card.classList.add(
    'event-card',
    'flex',
    'flex-col',
    'justify-center',
    'items-center',
    'border',
    'border-gray-100',
    'rounded-xl',
    'shadow-md',
    'mb-3',
    'h-84',
    'box-border',
    'overflow-hidden',
    'hover:shadow-lg',
    'cursor-pointer',
    'w-11/12',
    'mx-auto',
    'sm:w-3/4'
  );
  return {
    card,
    postLink,
  };
}

const renderPosts = async (category) => {
  cancelRequests();
  container.innerHTML = '';
  try {
    const posts = await getPosts(category);
    posts.forEach(async (post) => {
      const { postLink, card } = await createPostCard(post);
      card.innerHTML = `
    <div class="w-full h-40 flex justify-center items-center">
    <img src="${post.imageURI}" class="object-cover rounded-xl h-28 w-5/6 lg:w-1/2 max-w-full max-h-full" alt="${post.altText}">
  </div>
  <div class='flex flex-col justify-center items-center w-full'>
    <h3 class='text-md font-semibold line-clamp-2 sm:text-xl text-center mt-2'>${post.title}</h3>
    <div class="flex items-center justify-between lg:w-1/2 sm:w-3/4 mt-2">
      <p class='text-xs mb-1 text-gray-500 sm:text-sm'>
        <i class="fas fa-users text-center w-4 h-4 mr-1 text-black"></i>${post.author.name}
      </p>
      <p class='text-xs mb-1 text-gray-500 sm:text-sm'>
        <i class="fas fa-map-marker-alt text-center w-4 h-4 mr-1 text-black"></i>${post.location}
      </p>
      <p class='text-xs mb-1 text-gray-500 sm:text-sm'>
        <i class="far fa-calendar-alt text-center w-4 h-4 mr-1 text-black"> </i>${new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  </div>
    `
      card.appendChild(postLink);
      container.appendChild(card);
    });
  } catch (error) {
    console.log(error);
  }
}

// Sort feeds handler
const sortFeeds = async (button) => {
  const category = button.dataset.apiQuery;
  await renderPosts(category);
}

// Handler for feeds button
const feedsButtonHandler = async () => {
  // Cancel any pending requests
  cancelRequests();
  container.innerHTML = "";
  feedsButton.classList.add('active');
  eventsButton.classList.remove('active');
  const outdoorsIcon = document.querySelector('.outdoors')
  outdoorsIcon ? outdoorsIcon.classList.remove('hidden') : null;
  sortingButtons.forEach(btn => {
    btn.classList.remove('active-icon');
  });
  defaultSortBtn.classList.add('active-icon');
  await sortFeeds(defaultSortBtn);
}

feedsButton.addEventListener('click', () => {
  feedsButtonHandler();
});