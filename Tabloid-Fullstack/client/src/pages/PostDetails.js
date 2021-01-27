import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Jumbotron } from 'reactstrap';
import PostComments from '../components/PostComments';
import PostReactions from '../components/PostReactions';
import formatDate from '../utils/dateFormatter';
import './PostDetails.css';
import { PostTagContext } from '../providers/PostTagProvider';
import PostTagCard from '../components/PostTagCard';
import { TagContext } from '../providers/TagProvider';
import { Button } from 'reactstrap';
import { UserProfileContext } from '../providers/UserProfileProvider';
import { useHistory } from 'react-router-dom';
import { SubscriptionContext } from '../providers/SubscriptionProvider';
import WindowChecker from '../utils/WindowChecker';

const PostDetails = () => {
  const { postId } = useParams();
  const [post, setPost] = useState();
  const [reactionCounts, setReactionCounts] = useState([]);
  const { postTags, getPostsTags, addPostTag, deletePostTag } = useContext(
    PostTagContext
  );
  const { tags, getTags, setTags, getTagById } = useContext(TagContext);
  const { getCurrentUser, getToken } = useContext(UserProfileContext);
  const { subs, getSubsByUser, addSub, updateSub } = useContext(
    SubscriptionContext
  );
  const tagToSave = useRef(null);

  const currentUser = getCurrentUser();
  const history = useHistory();

  const [readTime, setReadTime] = useState();
  useEffect(() => {
    WindowChecker();
    getToken()
      .then((token) =>
        fetch(`/api/post/${postId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => {
          if (res.status === 404) {
            toast.error("This isn't the post you're looking for");
            return;
          }
          return res.json();
        })
      )
      .then((data) => {
        if (data !== undefined) {
          if (data.post.isApproved === true) {
            setPost(data.post);
            setReactionCounts(data.reactionCounts);
            getPostsTags(postId);
            getTags();
            getSubsByUser();
            setReadTime(data.readTime);
          }
          if (data.post.isApproved !== true) {
            if (
              currentUser.id === data.post.userProfileId ||
              currentUser.userTypeId === 1
            ) {
              setPost(data.post);
              setReactionCounts(data.reactionCounts);
              getPostsTags(postId);
              getTags();
              getSubsByUser();
              setReadTime(data.readTime);
            }
            if (
              currentUser.id !== data.post.userProfileId &&
              currentUser.userTypeId === 2
            ) {
              toast.error("This isn't the post you're looking for");
            }
          }
        }
      });
  }, [postId]);

  if (!post) return null;

  const updatePostApprovalToggle = (postToToggle) => {
    if (postToToggle.isApproved === false) {
      postToToggle.isApproved = true;
    } else {
      postToToggle.isApproved = false;
    }
    getToken().then((token) => {
      fetch(`/api/post/approval/${postToToggle.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postToToggle),
      }).then(() => {
        if (postToToggle.isApproved === true) {
          history.push('/UnapprovedPosts');
        } else {
          history.push('/explore');
        }
      });
    });
  };

  const tagList = () => {
    if (postTags != null && currentUser.id === post.userProfile.id) {
      return postTags.map((postTag) => (
        <div className="ml-4 tagButtonContainer" key={postTag.id}>
          <PostTagCard postTag={postTag} />
          <Button
            className="btn btn-danger deleteTag"
            onClick={(e) => {
              deletePostTag(postTag);
            }}
          >
            x
          </Button>
        </div>
      ));
    } else if (postTags != null) {
      return postTags.map((postTag) => (
        <div className="ml-4" key={postTag.id}>
          <PostTagCard postTag={postTag} />
        </div>
      ));
    }
  };

  const postTagSaver = () => {
    const tagId = parseInt(tagToSave.current.value);
    if (tagId !== 0) {
      const postTag = {
        postId,
        tagId,
      };
      addPostTag(postTag);
      tagToSave.current.value = '0';
    }
  };

  const userCheck = () => {
    let empty = [];

    let dropdownTags = [];
    if (postTags) {
      for (const obj of postTags) {
        empty.push(obj.tagId);
      }

      tags.map((tag) => {
        if (!empty.includes(tag.id)) {
          dropdownTags.push(tag);
        } else {
          empty.push(tag.id);
        }
      });
    }

    if (currentUser.id === post.userProfile.id && dropdownTags) {
      return (
        <fieldset>
          <div className="form-group dropdown-form">
            <select
              defaultValue=""
              className="form-control col-12 dropdown"
              ref={tagToSave}
            >
              <option value="0" className="add-tag">
                Choose Tag...
              </option>
              {dropdownTags
                .filter((tag) => tag.active === true)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
            <Button className="btn btn-success tagAdd" onClick={postTagSaver}>
              add
            </Button>
          </div>
        </fieldset>
      );
    }
  };

  const deletePost = () => {
    var r = window.confirm(
      'Are you sure you want to delete this? It cannot be undone.'
    );
    if (r == true) {
      getToken().then((token) => {
        fetch(`../api/post/${postId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(history.push('/myposts'));
      });
    }
  };

  const ImageClip = () => {
    if (post.imageLocation !== null) {
      return (
        <Jumbotron
          className="post-details__jumbo"
          style={{ backgroundImage: `url('${post.imageLocation}')` }}
        ></Jumbotron>
      );
    } else {
      return (
        <Jumbotron
          className="post-details__jumbo"
          style={{
            backgroundImage: `url('https://build.dfomer.com/wp-content/uploads/2016/04/dummy-post-horisontal-thegem-blog-default.jpg')`,
          }}
        ></Jumbotron>
      );
    }
  };

  const ProfileImage = () => {
    if (post.userProfile.imageLocation !== null) {
      return (
        <img className="profilePic" src={post.userProfile.imageLocation} />
      );
    } else {
      return (
        <img
          className="profilePic"
          src={
            'https://build.dfomer.com/wp-content/uploads/2016/04/dummy-post-horisontal-thegem-blog-default.jpg'
          }
        />
      );
    }
  };

  const TrashCan = () => {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    if (user.id === post.userProfileId) {
      return (
        <div
          className="delete-post-button"
          onClick={() => {
            deletePost();
          }}
        >
          🗑️
        </div>
      );
    } else {
      return null;
    }
  };

  const subChecker = () => {
    if (subs) {
      const userRelationship = subs.filter(
        (sub) => sub.providerUserProfileId === post.userProfileId
      );
      if (
        userRelationship[0] &&
        userRelationship[0].endDateTime === '9999-12-31T23:59:59.997'
      ) {
        return (
          <Button
            className="btn btn-outline-danger ml-3 circle"
            onClick={(e) => updateSub(userRelationship[0])}
          >
            Unsubscribe
          </Button>
        );
      } else if (userRelationship[0]) {
        return (
          <Button
            className="btn btn-danger ml-3 circle"
            onClick={(e) => updateSub(userRelationship[0])}
          >
            Subscribe
          </Button>
        );
      } else {
        return (
          <Button
            className="btn btn-danger ml-3 circle"
            onClick={(e) => addSub(post)}
          >
            Subscribe
          </Button>
        );
      }
    } else {
      return (
        <Button
          className="btn btn-danger ml-3 circle subButton"
          onClick={(e) => addSub(post)}
        >
          Subscribe
        </Button>
      );
    }
  };

  const approvalChecker = () => {
    if (post.isApproved === false && currentUser.userTypeId === 1) {
      return (
        <Button
          className="btn btn-danger ml-3 circle"
          onClick={() => {
            updatePostApprovalToggle(post);
          }}
        >
          Approve
        </Button>
      );
    }

    if (post.isApproved === true && currentUser.userTypeId === 1) {
      return (
        <Button
          className="btn btn-danger ml-3 circle"
          onClick={() => {
            updatePostApprovalToggle(post);
          }}
        >
          UnApprove
        </Button>
      );
    }
  };

  return (
    <div>
      <ImageClip />
      <div className="container">
        <h1>
          {post.title} {approvalChecker()}{' '}
        </h1>
        <h5 className="text-danger">{post.category.name}</h5>
        <div className="row">
          <div className="col userProfileInfo">
            <div className="imgName">
              {ProfileImage()}
              {post.userProfile.displayName}
            </div>
            {subChecker()}
          </div>
          <div className="col">
            <div>
              {formatDate(post.publishDateTime)}
              <TrashCan />
            </div>
          </div>
          <div className="col">{readTime}</div>
        </div>
        <div className="text-justify post-details__content mt-4">
          {post.content}
        </div>
        {userCheck()}
        <div className="tags-container mt-4">
          Tags:
          {tagList()}
        </div>
        <div className="my-4">
          <PostReactions postReactions={reactionCounts} />
        </div>
        <PostComments />
      </div>
    </div>
  );
};

export default PostDetails;
