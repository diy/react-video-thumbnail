import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

function createThumbnailImageFromVideo(video) {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 && height === 0) {
    throw new Error('Cannot generate video thumbnail.');
  }
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 1.0);
},

export default class VideoThumbnailSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      thumbnails: [],
      selectedThumbnailId: 0,
      startTime: 0,
      endTime: 0,
      currentTime: 0,
    };
  }

  addThumbnail(src) {
    this.setState({
      thumbnails: [...this.state.thumbnails, src],
    });
  }

  handlePlay() {
    const video = this.videoNode;
    const { interval } = this.props;
    video.muted = true;
    let src;
    try {
      src = createThumbnailImageFromVideo(video);
    } catch (err) {
      return this.props.onThumbnailError(err);
    }
    this.props.onClickThumbnail(0, src);
    this.setState({
      startTime: video.seekable.start(0),
      endTime: video.seekable.end(0),
      currentTime: this.state.currentTime + interval,
    }, () => {
      video.currentTime = this.state.currentTime;
    });
  }

  handleSeeked() {
    const video = this.videoNode;
    const { interval } = this.props;
    const src = createThumbnailImageFromVideo(video);
    this.setState({
      thumbnails: [...this.state.thumbnails, src],
      currentTime: this.state.currentTime + interval,
    }, () => {
      const { currentTime, endTime } = this.state;
      if (currentTime < endTime) {
        video.currentTime = currentTime;
      }
    });
  }

  handleClick(id) {
    const { endTime, thumbnails } = this.state;
    this.setState({
      selectedThumbnailId: id,
    });
    const percentage = (id / endTime) * 100;
    this.props.onClickThumbnail(percentage, thumbnails[id]);
  }

  render() {
    const { thumbnails, selectedThumbnailId } = this.state;
    const { videoSrc } = this.props;
    return (
      <div className="video-thumbnail-selector-component">
        <div
          className="video-thumbnail-selection"
          style={{ backgroundImage: `url(${thumbnails[selectedThumbnailId]})` }}
        />
        <div className="video-thumbnails">
          {thumbnails.map((src, key) => (
            <div
              className={classNames('video-thumbnail', { selected: selectedThumbnailId === key })}
              style={{ backgroundImage: `url(${src})` }}
              key={key}
              onClick={this.handleClick.bind(this, key)}
            />
          ))}
        </div>
        <video
          ref={node => (this.videoNode = node)}
          preload="metadata"
          onPlay={this.handlePlay.bind(this)}
          onSeeked={this.handleSeeked.bind(this)}
          autoPlay
          muted
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    );
  }
}

VideoThumbnailSelector.propTypes = {
  videoSrc: PropTypes.string,
  interval: PropTypes.number,
  onClickThumbnail: PropTypes.func,
  onThumbnailError: PropTypes.func,
};
