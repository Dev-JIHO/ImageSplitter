/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, ZoomIn, ZoomOut, Save } from 'lucide-react';

export default function App() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'control' | 'preview' | 'tools'>('control');

  return (
    <div 
      className="app-shell" 
      data-left-collapsed={leftCollapsed} 
      data-right-collapsed={rightCollapsed}
    >
      <div 
        className="control-panel" 
        data-collapsed={leftCollapsed} 
        data-mobile-active={mobileActiveTab === 'control'}
      >
        <button 
          className="panel-collapse-toggle" 
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          aria-label="왼쪽 패널 토글"
        >
          {leftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        {!leftCollapsed && (
          <>
            <div className="title-block">
              <h1>스튜디오 설정</h1>
              <p>기본 설정을 구성하세요.</p>
            </div>
            
            <div className="field">
              <label>프로젝트 이름</label>
              <input type="text" placeholder="제목 없는 프로젝트" />
            </div>

            <div className="upload-row">
              <label className="upload-button">
                <Upload size={16} className="mr-2" style={{ marginRight: '8px' }} />
                <span>이미지 선택</span>
                <input type="file" accept="image/*" />
              </label>
              <div className="upload-filename">선택된 파일 없음</div>
            </div>

            <fieldset className="segmented">
              <legend>품질 프리셋</legend>
              <button className="active">웹</button>
              <button>인쇄</button>
            </fieldset>

            <details className="options-group">
              <summary>고급 설정</summary>
              <div className="options-group-body">
                <label className="check-field">
                  <input type="checkbox" defaultChecked />
                  <span>정밀 처리 활성화</span>
                </label>
                <div className="field">
                  <label>포맷</label>
                  <select>
                    <option>JPEG</option>
                    <option>PNG</option>
                    <option>WebP</option>
                  </select>
                </div>
              </div>
            </details>
          </>
        )}
      </div>

      <div 
        className="preview-panel" 
        data-mobile-active={mobileActiveTab === 'preview'}
      >
        <div className="preview-legend">
          <span><span className="legend-swatch blue" /> 그리드</span>
          <span><span className="legend-swatch red" /> 재단 여백</span>
        </div>
        
        <div className="preview-toolbar">
          <button className="toolbar-button" aria-label="축소" title="축소"><ZoomOut size={16} /></button>
          <div className="toolbar-range">
            <input type="range" min="10" max="200" defaultValue="100" />
            <strong>100%</strong>
          </div>
          <button className="toolbar-button" aria-label="확대" title="확대"><ZoomIn size={16} /></button>
        </div>

        <div className="empty-preview">
          <span>여기에 이미지를 드래그해서 놓거나 제어판에서 "이미지 선택"을 클릭하세요.</span>
          <div className="empty-steps">
            <div>1. 원본 이미지 업로드</div>
            <div>2. 도구 패널에서 매개변수 조정</div>
            <div>3. 최종 결과물 내보내기</div>
          </div>
        </div>
      </div>

      <div 
        className="tools-panel" 
        data-collapsed={rightCollapsed} 
        data-mobile-active={mobileActiveTab === 'tools'}
      >
        <button 
          className="panel-collapse-toggle" 
          onClick={() => setRightCollapsed(!rightCollapsed)}
          aria-label="오른쪽 패널 토글"
        >
          {rightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {!rightCollapsed && (
          <div className="tools-panel-body">
            <div className="step-heading">
              <span className="done">✓</span>
              <strong>조정</strong>
            </div>

            <div className="tool-group">
              <span className="tool-label">밝기</span>
              <div className="range-field">
                <div>
                  <input type="range" min="0" max="100" defaultValue="50" />
                  <span>50</span>
                </div>
              </div>
            </div>

            <div className="tool-group">
              <span className="tool-label">대비</span>
              <div className="range-field">
                <div>
                  <input type="range" min="0" max="100" defaultValue="50" />
                  <span>50</span>
                </div>
              </div>
            </div>

            <div className="summary">
              <div>
                <dt>예상 파일 크기</dt>
                <dd>~1.2 MB</dd>
              </div>
              <div>
                <dt>해상도</dt>
                <dd>1920x1080</dd>
              </div>
            </div>

            <button className="export-button">
               <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <Save size={16} /> 파일 내보내기
               </span>
            </button>
          </div>
        )}
      </div>

      <div className="mobile-bottom-nav">
         <button className={mobileActiveTab === 'control' ? 'active' : ''} onClick={() => setMobileActiveTab('control')}>설정</button>
         <button className={mobileActiveTab === 'preview' ? 'active' : ''} onClick={() => setMobileActiveTab('preview')}>미리보기</button>
         <button className={mobileActiveTab === 'tools' ? 'active' : ''} onClick={() => setMobileActiveTab('tools')}>도구</button>
      </div>
    </div>
  );
}
