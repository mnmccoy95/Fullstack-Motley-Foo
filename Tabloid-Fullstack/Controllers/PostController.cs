﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Tabloid_Fullstack.Models;
using Tabloid_Fullstack.Models.ViewModels;
using Tabloid_Fullstack.Repositories;

namespace Tabloid_Fullstack.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PostController : ControllerBase
    {

        private IPostRepository _repo;
        private IUserProfileRepository _userRepo;
        private ICommentRepository _commentRepo;
        private ITagRepository _tagRepo;

        public PostController(IPostRepository repo, IUserProfileRepository userRepo, ICommentRepository commentRepo, ITagRepository tagRepository)
        {
            _repo = repo;
            _userRepo = userRepo;
            _commentRepo = commentRepo;
            _tagRepo = tagRepository;
        }


        [HttpGet]
        public IActionResult Get()
        {
            var posts = _repo.Get();
            return Ok(posts);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var post = _repo.GetById(id);
            if (post == null)
            {
                return NotFound();
            }


            var reactionCounts = _repo.GetReactionCounts(id);
            var comments = _commentRepo.GetByPostId(id);
            var readTime = getPostReadTime(post);

            var postDetails = new PostDetails()
            {
                Post = post,
                ReactionCounts = reactionCounts,
                Comments = comments,
                ReadTime=readTime
            };
            return Ok(postDetails);
        }

        [HttpGet("getbytag/{tagId}")]
        public IActionResult GetByTagId(int tagId)
        {
            var tag = _tagRepo.GetById(tagId);
            if(tag.Active == false)
            {
                return NotFound();
            }

            var posts = _repo.GetByTagId(tagId);
            if (posts == null)
            {
                return NotFound();
            }

            return Ok(posts);
        }

        [HttpGet("getbyuser/{id}")]
        public IActionResult GetByUser(int id)
        {
            var posts = _repo.GetByUserProfileId(id);
            return Ok(posts);
        }

        [HttpPost]
        public IActionResult Post(Post post)
        {
            var currentUser = GetCurrentUserProfile();

            post.UserProfileId = currentUser.Id;

            _repo.Add(post);
            return CreatedAtAction("Get", new { id = post.Id }, post);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var user = GetCurrentUserProfile();
            var postToDelete = _repo.GetById(id);

            if (postToDelete.UserProfileId != user.Id)
            {
                return Unauthorized();
            }           
            
            _repo.Delete(id);
            return NoContent();
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Post post)
        {
            if (id != post.Id)
            {
                return BadRequest();
            }

            var user = GetCurrentUserProfile();

            if (user.Id != post.UserProfileId)
            {
                return Unauthorized();
            }

            _repo.Update(post);
            return NoContent();
        }

        [HttpPut("approval/{id}")]
        public IActionResult Approval(int id, Post post)
        {
            if (id != post.Id)
            {
                return BadRequest();
            }

            var user = GetCurrentUserProfile();

            if (user.UserTypeId != 1)
            {
                return Unauthorized();
            }

            _repo.Update(post);
            return NoContent();
        }

        [HttpGet("Home")]
        public IActionResult GetHome()
        {
            var posts = _repo.GetHome();
            return Ok(posts);
        }
        
        [HttpGet("UnapprovedPosts")]
        public IActionResult GetUnapprovedPosts()
        {
            var posts = _repo.GetUnapprovedPosts();
            return Ok(posts);
        }

        private UserProfile GetCurrentUserProfile()
        {
            var firebaseUserId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            return _userRepo.GetByFirebaseUserIdBare(firebaseUserId);
        }

        private string getPostReadTime(Post post)
        {

            var readTimeNumber = Math.Floor((double)post.Content.Length / 265);
            string readTimeString;
            if (readTimeNumber<= 1)
            {
                readTimeString = "A minute";
            }
            else { readTimeString = readTimeNumber + " minutes"; }
            return readTimeString;
        }
    }
}
