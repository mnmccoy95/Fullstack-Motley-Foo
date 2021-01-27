import React, { useContext, useEffect, useState } from 'react';
import './PostComments.css';
import formatDate from '../utils/dateFormatter';
import { useHistory, useParams } from 'react-router-dom';
import { UserProfileContext } from '../providers/UserProfileProvider';
import { toast } from 'react-toastify';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import WindowChecker from '../utils/WindowChecker';

const PostComments = () => {
  const { getToken, getCurrentUser } = useContext(UserProfileContext);
  const { postId } = useParams();
  const [comments, setComments] = useState([]);
  const [commentSubjectForDelete, setCommentSubjectForDelete] = useState('');
  const [commentSubject, setCommentSubject] = useState('');
  const [commentContent, setCommentContent] = useState('');
  // This is state used for editing a comment within a modal form
  const [EditCommentSubject, setEditCommentSubject] = useState('');
  const [EditCommentContent, setEditCommentContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  // This is state used for deleting comments
  const [pendingDelete, setPendingDelete] = useState(false);
  // This is holding the comment's id so we can pass it on in the api call
  const [commentIdForDeleteOrEdit, setCommentIdForDeleteOrEdit] = useState(0);

  useEffect(() => {
    WindowChecker();
    getComments();
  }, []);

  const getComments = () => {
    getToken().then((token) =>
      fetch(`/api/comment/${postId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 404) {
            toast.error('Oops something went wrong with comment api');
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data != undefined) {
            setComments(data);
          }
        })
    );
  };

  const saveNewComment = () => {
    const commentToAdd = {
      postId: postId,
      subject: commentSubject,
      content: commentContent,
    };
    getToken().then((token) =>
      fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentToAdd),
      }).then(() => {
        setCommentSubject('');
        setCommentContent('');
        getComments();
      })
    );
  };

  const editComment = (commentId) => {
    const user = getCurrentUser();
    const commentToEdit = {
      id: commentId,
      postId: postId,
      subject: EditCommentSubject,
      content: EditCommentContent,
      userProfileId: user.id,
    };

    getToken().then((token) => {
      fetch(`/api/comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentToEdit),
      }).then(() => {
        setCommentSubject('');
        setCommentContent('');
        getComments();
        setCommentIdForDeleteOrEdit(0);
      });
    });
  };

  const deleteComment = (commentId) => {
    getToken().then((token) => {
      fetch(`../api/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(() => {
        getComments();
        setCommentIdForDeleteOrEdit(0);
      });
    });
  };

  return (
    <div className="container mt-5">
      <div className="d-flex flex-column comment-section">
        <div className="p-2">
          <div className="d-flex align-items-start" style={{ height: '47px' }}>
            <textarea
              value={commentSubject}
              placeholder="Comment Subject"
              className="form-control ml-2 mb-1 shadow-none border textarea subject-text-field"
              onChange={(e) => setCommentSubject(e.target.value)}
              style={{ height: '47px' }}
            ></textarea>
          </div>
          <div className="d-flex flex-row align-items-start">
            <textarea
              value={commentContent}
              placeholder="Comment Content"
              className="form-control ml-2 mt-1 shadow-none border textarea"
              onChange={(e) => setCommentContent(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-2 text-right">
            <button
              className="btn btn-primary btn-sm shadow-none"
              type="button"
              onClick={saveNewComment}
            >
              Post comment
            </button>
            <button
              className="btn btn-outline-primary btn-sm ml-1 shadow-none"
              type="button"
              onClick={(click) => {
                setCommentContent('');
                setCommentSubject('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center row">
        <div className="col-md-8">
          {comments.map((comment) => (
            <div
              className="d-flex flex-column comment-section my-1 bg-light"
              key={comment.id}
            >
              <div className="bg-white p-2">
                <div className="d-flex flex-row user-info">
                  <div className="d-flex flex-column justify-content-start ml-2">
                    <span className="d-block font-weight-bold name">
                      {comment.userProfile.displayName}
                    </span>
                    <span className="date text-black-50">
                      Posted - {formatDate(comment.createDateTime)}{' '}
                    </span>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="comment-subject">{comment.subject}</p>
                </div>
                <div className="mt-1">
                  <p className="comment-text">{comment.content}</p>
                </div>
                {getCurrentUser().id === comment.userProfileId ? (
                  <div>
                    <Button
                      size="sm"
                      className="btn btn-danger mr-1"
                      onClick={() => {
                        setCommentSubjectForDelete(comment.subject);
                        setPendingDelete(true);
                        setCommentIdForDeleteOrEdit(comment.id);
                      }}
                    >
                      {' '}
                      Delete{' '}
                    </Button>
                    <Button
                      size="sm"
                      className="btn ml-1"
                      onClick={() => {
                        setEditCommentSubject(comment.subject);
                        setEditCommentContent(comment.content);
                        setCommentIdForDeleteOrEdit(comment.id);
                        setIsEditing(true);
                      }}
                    >
                      {' '}
                      Edit{' '}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* This is the modal for deleting a comment. */}
      <Modal isOpen={pendingDelete}>
        <ModalHeader>
          Delete this comment {commentSubjectForDelete}?
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete this comment? This action cannot be
          undone.
        </ModalBody>
        <ModalFooter>
          <Button onClick={(e) => setPendingDelete(false)}>No, Cancel</Button>
          <Button
            className="btn btn-outline-danger"
            onClick={(e) => {
              setPendingDelete(false);
              deleteComment(commentIdForDeleteOrEdit);
            }}
          >
            Yes, Delete
          </Button>
        </ModalFooter>
      </Modal>
      {/* This is the Editing modal */}
      <Modal isOpen={isEditing}>
        <ModalHeader>Edit this comment?</ModalHeader>
        <ModalBody>
          <div className="d-flex flex-column comment-section">
            <div className="p-2">
              <div
                className="d-flex align-items-start"
                style={{ height: '47px' }}
              >
                <textarea
                  value={EditCommentSubject}
                  placeholder="Comment Subject"
                  className="form-control ml-2 mb-1 shadow-none border textarea subject-text-field"
                  onChange={(e) => setEditCommentSubject(e.target.value)}
                  style={{ height: '47px' }}
                ></textarea>
              </div>
              <div className="d-flex flex-row align-items-start">
                <textarea
                  value={EditCommentContent}
                  placeholder="Comment Content"
                  className="form-control ml-2 mt-1 shadow-none border textarea"
                  onChange={(e) => setEditCommentContent(e.target.value)}
                ></textarea>
              </div>
              <div className="mt-2 text-right">
                <button
                  className="btn btn-primary btn-sm shadow-none"
                  type="button"
                  onClick={() => {
                    editComment(commentIdForDeleteOrEdit);
                    setIsEditing(false);
                  }}
                >
                  Save Edit{' '}
                </button>
                <button
                  className="btn btn-outline-primary btn-sm ml-1 shadow-none"
                  type="button"
                  onClick={(click) => {
                    setEditCommentContent('');
                    setEditCommentSubject('');
                    setIsEditing(false);
                  }}
                >
                  Cancel Edit
                </button>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default PostComments;
