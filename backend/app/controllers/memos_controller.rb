class MemosController < ApplicationController
  def index
    memos = Memo.all
    render json: memos
  end
end
